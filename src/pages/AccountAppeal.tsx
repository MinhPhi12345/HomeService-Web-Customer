// US48 (SRS v1.8) – Yêu cầu mở khóa tài khoản: xác thực email bằng OTP → xem lý do khóa → gửi giải trình (≤ 3 ảnh)
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, ImagePlus, Loader2, LockKeyhole, Mail, ShieldQuestion, X } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import OtpInput from "../components/OtpInput";
import { appealService } from "../services/appealService";
import { getErrorMessage } from "../services/api";
import type { AppealContext, AppealStatus } from "../types";
import { formatDateTime } from "../utils/format";
import { mediaUrl } from "../utils/media";
import { secondsFromMessage, useResendTimer } from "../utils/otp";
import { validateEmail } from "../utils/validators";

const CONTENT_MIN = 20;
const CONTENT_MAX = 2000;
const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const SESSION_KEY = "hs_appeal_session";

const STATUS: Record<AppealStatus, { label: string; tone: string }> = {
  0: { label: "Đang chờ xử lý", tone: "amber" },
  1: { label: "Đã chấp nhận", tone: "green" },
  2: { label: "Đã từ chối", tone: "rose" },
};

type Step = "email" | "otp" | "form" | "done";

/** Phiên gửi yêu cầu (30 phút) giữ trong tab để F5 không phải nhập lại OTP */
const saved = {
  get(): string | null {
    try {
      return sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    try {
      if (token) sessionStorage.setItem(SESSION_KEY, token);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* trình duyệt chặn lưu trữ – bỏ qua */
    }
  },
};

export default function AccountAppeal() {
  const [params] = useSearchParams();
  const state = useLocation().state as { email?: string } | null;
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(state?.email ?? params.get("email") ?? "");
  const [masked, setMasked] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [ctx, setCtx] = useState<AppealContext | null>(null);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; code?: string; content?: string; files?: string }>({});
  const [serverError, setServerError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const timer = useResendTimer();
  const fileRef = useRef<HTMLInputElement>(null);

  // Còn phiên trong tab → mở thẳng bước gửi yêu cầu
  useEffect(() => {
    const t = saved.get();
    if (!t) return;
    appealService
      .session(t)
      .then((c) => {
        setToken(t);
        setCtx(c);
        setStep("form");
      })
      .catch(() => saved.set(null));
  }, []);

  const sendOtp = async () => {
    const emailError = validateEmail(email);
    setErrors({ email: emailError });
    setServerError("");
    if (emailError) return;
    setLoading(true);
    try {
      const sent = await appealService.sendOtp(email.trim().toLowerCase());
      setMasked(sent.maskedEmail);
      setInfo(`Nếu tài khoản này đang bị khóa, mã OTP đã được gửi tới ${sent.maskedEmail}. Mã có hiệu lực 5 phút.`);
      setCode("");
      timer.restart(sent.resendAfterSeconds);
      setStep("otp");
    } catch (err) {
      const msg = getErrorMessage(err);
      const wait = secondsFromMessage(msg);
      if (wait) {
        timer.restart(wait);
        setStep("otp");
      }
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6) {
      setErrors({ code: "Vui lòng nhập đủ 6 số của mã OTP." });
      return;
    }
    setErrors({});
    setServerError("");
    setLoading(true);
    try {
      const s = await appealService.verify(email.trim().toLowerCase(), value);
      saved.set(s.token);
      setToken(s.token);
      setCtx(s.context);
      setStep("form");
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const pickFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!token || !list.length) return;
    const room = MAX_FILES - files.length;
    if (list.length > room) {
      setErrors((x) => ({ ...x, files: `Tối đa ${MAX_FILES} ảnh đính kèm.` }));
      list.splice(room);
    } else setErrors((x) => ({ ...x, files: undefined }));
    setUploading(true);
    setServerError("");
    try {
      for (const f of list) {
        if (!/^image\/(jpeg|png)$/.test(f.type)) {
          setErrors((x) => ({ ...x, files: "Chỉ hỗ trợ ảnh JPG hoặc PNG." }));
          continue;
        }
        if (f.size > MAX_BYTES) {
          setErrors((x) => ({ ...x, files: "Ảnh tối đa 5 MB." }));
          continue;
        }
        const url = await appealService.upload(token, f);
        setFiles((cur) => [...cur, { url, name: f.name }]);
      }
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const text = content.trim();
    const contentError =
      text.length < CONTENT_MIN || text.length > CONTENT_MAX ? `Vui lòng viết giải trình (${CONTENT_MIN}–${CONTENT_MAX} ký tự).` : "";
    setErrors({ content: contentError });
    setServerError("");
    if (contentError) return;
    setLoading(true);
    try {
      const c = await appealService.submit(
        token,
        text,
        files.map((f) => f.url),
      );
      saved.set(null);
      setToken(null);
      setCtx(c);
      setStep("done");
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    saved.set(null);
    setToken(null);
    setCtx(null);
    setCode("");
    setServerError("");
    setInfo("");
    setStep("email");
  };

  const notices = (
    <>
      {info && !serverError && step === "otp" && (
        <div className="notice notice--success" role="status">
          {info}
        </div>
      )}
      {serverError && (
        <div className="notice notice--danger" role="alert">
          {serverError}
        </div>
      )}
    </>
  );

  return (
    <AuthLayout
      title="Mở khóa tài khoản"
      desc="Xác thực email để xem lý do khóa và gửi giải trình. Đội ngũ HomeService sẽ xem xét và trả lời qua email."
      extra="chips"
      footNote="Không chia sẻ mã OTP cho bất kỳ ai, kể cả nhân viên HomeService."
    >
      {step === "email" && (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            void sendOtp();
          }}
          noValidate
        >
          <span className="otp-icon" aria-hidden="true">
            <ShieldQuestion size={28} />
          </span>
          <h1>Yêu cầu mở khóa</h1>
          <p className="auth-lead">Nhập email của tài khoản bị khóa. Chúng tôi gửi mã OTP để xác nhận bạn là chủ tài khoản.</p>
          {notices}
          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="input-icon">
              <Mail size={18} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Nhập email tài khoản"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                autoFocus
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : "Gửi mã OTP"}
          </button>
          <p className="auth-switch">
            <Link to="/login" className="link">
              Quay lại đăng nhập
            </Link>
          </p>
        </form>
      )}

      {step === "otp" && (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
          noValidate
        >
          <button type="button" className="link otp-back" onClick={() => setStep("email")}>
            <ArrowLeft size={16} /> Đổi email
          </button>
          <h1>Nhập mã xác thực</h1>
          <p className="auth-lead">
            Nhập mã 6 số đã gửi tới <b>{masked || email}</b>.
          </p>
          {notices}
          <div className="field">
            <label>Mã OTP</label>
            <OtpInput
              value={code}
              onChange={(v) => {
                setCode(v);
                setErrors({});
              }}
              onComplete={(v) => void verify(v)}
              invalid={!!errors.code}
              disabled={loading}
            />
            {errors.code && <span className="field-error">{errors.code}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : "Xác nhận"}
          </button>
          <p className="otp-resend">
            Chưa nhận được mã?{" "}
            {timer.left > 0 ? (
              <span className="hint">Gửi lại sau {timer.left} giây</span>
            ) : (
              <button type="button" className="link" onClick={() => void sendOtp()} disabled={loading}>
                Gửi lại mã
              </button>
            )}
          </p>
        </form>
      )}

      {step === "form" && ctx && (
        <form className="auth-form appeal-form" onSubmit={submit} noValidate>
          <h1>Gửi giải trình</h1>
          <p className="auth-lead">
            Tài khoản <b>{ctx.fullName}</b> ({ctx.maskedEmail})
          </p>
          <LockInfo ctx={ctx} />
          {notices}

          {ctx.canSubmit ? (
            <>
              <div className="field">
                <label htmlFor="content">Nội dung giải trình</label>
                <textarea
                  id="content"
                  rows={6}
                  maxLength={CONTENT_MAX}
                  placeholder="Trình bày rõ sự việc, bạn đã khắc phục thế nào (VD: đã thanh toán khoản nợ ngày…, mã giao dịch…)."
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setErrors((x) => ({ ...x, content: undefined }));
                  }}
                  aria-invalid={!!errors.content}
                />
                {errors.content ? (
                  <span className="field-error">{errors.content}</span>
                ) : (
                  <span className="hint">
                    {content.trim().length}/{CONTENT_MAX} ký tự (tối thiểu {CONTENT_MIN}).
                  </span>
                )}
              </div>

              <div className="field">
                <label>Ảnh minh chứng (không bắt buộc, tối đa {MAX_FILES} ảnh)</label>
                <div className="appeal-files">
                  {files.map((f, i) => (
                    <div key={f.url} className="appeal-thumb">
                      <img src={mediaUrl(f.url)} alt={f.name} />
                      <button
                        type="button"
                        aria-label={`Bỏ ảnh ${i + 1}`}
                        onClick={() => setFiles((cur) => cur.filter((x) => x.url !== f.url))}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {files.length < MAX_FILES && (
                    <button type="button" className="appeal-add" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="spin" size={20} /> : <ImagePlus size={20} />}
                      <span>{uploading ? "Đang tải…" : "Thêm ảnh"}</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png" multiple hidden onChange={pickFiles} />
                {errors.files ? (
                  <span className="field-error">{errors.files}</span>
                ) : (
                  <span className="hint">JPG hoặc PNG, mỗi ảnh tối đa 5 MB. VD: ảnh chụp biên lai chuyển khoản.</span>
                )}
              </div>

              <p className="hint appeal-left">
                Bạn còn {ctx.remainingAppeals} lần gửi yêu cầu cho lần khóa này. Mỗi lần chỉ có 1 yêu cầu được xử lý.
              </p>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading || uploading}>
                {loading ? <span className="spinner" /> : "Gửi yêu cầu mở khóa"}
              </button>
            </>
          ) : (
            <div className="notice notice--warn" role="status">
              <Clock size={18} />
              <div>{ctx.blockedMessage ?? "Hiện chưa thể gửi yêu cầu mới."}</div>
            </div>
          )}

          <History ctx={ctx} />
          <p className="auth-switch">
            <button type="button" className="link" onClick={restart}>
              Dùng email khác
            </button>
          </p>
        </form>
      )}

      {step === "done" && ctx && (
        <div className="auth-form appeal-done">
          <span className="otp-icon appeal-done-icon" aria-hidden="true">
            <CheckCircle2 size={30} />
          </span>
          <h1>Đã gửi yêu cầu</h1>
          <p className="auth-lead">
            HomeService đã nhận yêu cầu mở khóa của bạn và gửi email xác nhận tới <b>{ctx.maskedEmail}</b>. Kết quả xem xét cũng sẽ
            được gửi qua email này.
          </p>
          <History ctx={ctx} />
          <Link to="/login" className="btn btn-primary btn-lg btn-block">
            Về trang đăng nhập
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}

function LockInfo({ ctx }: { ctx: AppealContext }) {
  return (
    <div className="lock-box lock-box--soft">
      <div className="lock-box-head">
        <LockKeyhole size={18} />
        <b>Thông tin khóa tài khoản</b>
      </div>
      <dl>
        <dt>Lý do</dt>
        <dd>{ctx.lockReasonText}</dd>
        {ctx.lockDetail && (
          <>
            <dt>Chi tiết</dt>
            <dd>{ctx.lockDetail}</dd>
          </>
        )}
        {ctx.lockedAt && (
          <>
            <dt>Thời điểm</dt>
            <dd>{formatDateTime(ctx.lockedAt)}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

function History({ ctx }: { ctx: AppealContext }) {
  if (!ctx.history.length) return null;
  return (
    <div className="appeal-history">
      <div className="label">Các yêu cầu đã gửi</div>
      <ul>
        {ctx.history.map((h, i) => (
          <li key={h.id}>
            <div className="appeal-history-top">
              <span>
                Lần {ctx.history.length - i} · {formatDateTime(h.createdAt)}
              </span>
              <span className={`badge badge--${STATUS[h.status].tone}`}>{STATUS[h.status].label}</span>
            </div>
            {h.adminNote && <p>Phản hồi: {h.adminNote}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
