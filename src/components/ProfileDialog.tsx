import { useEffect, useState } from "react";
import { BadgeCheck, MapPin, Star, TrendingUp, Trophy } from "lucide-react";
import Modal from "./Modal";
import { profileService } from "../services/bookingService";
import { getErrorMessage } from "../services/api";
import type { PublicProfile, ReviewItem } from "../types";
import { formatDate, initials } from "../utils/format";
import { mediaUrl } from "../utils/media";

const Stars = ({ n, size = 13 }: { n: number; size?: number }) => (
  <span className="stars" aria-label={`${n} sao`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        fill={i <= Math.round(n) ? "#ffb938" : "none"}
        color={i <= Math.round(n) ? "#ffb938" : "#c5d1d5"}
      />
    ))}
  </span>
);

const monthYear = (iso: string) => formatDate(iso).slice(3);

/** US26 – Hồ sơ của Tasker / khách trong đơn kèm các đánh giá người đó đã nhận (người viết chỉ hiện tên gọi). */
export default function ProfileDialog({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");
  // Danh sách đánh giá: null = đang hiện 3 đánh giá mới nhất kèm trong hồ sơ
  const [stars, setStars] = useState<number | null>(null);
  const [list, setList] = useState<ReviewItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    profileService
      .get(userId)
      .then(setProfile)
      .catch((e) => setError(getErrorMessage(e)));
  }, [userId]);

  const isTasker = profile?.role === 1;
  const avatar = mediaUrl(profile?.avatarUrl);

  const loadReviews = (s: number | null, nextPage: number) => {
    setLoadingReviews(true);
    setReviewError("");
    profileService
      .reviews(userId, { stars: s, page: nextPage, pageSize: 5 })
      .then((res) => {
        setList((old) => (nextPage === 1 || !old ? res.items : [...old, ...res.items]));
        setPage(nextPage);
        setListTotal(res.totalCount);
      })
      .catch((e) => setReviewError(getErrorMessage(e)))
      .finally(() => setLoadingReviews(false));
  };
  const pickStars = (s: number | null) => {
    if (s === stars && list) return;
    setStars(s);
    setList(null);
    loadReviews(s, 1);
  };
  const shown = list ?? profile?.reviews ?? [];
  const totalForFilter = list ? listTotal : profile?.reviewCount ?? 0;
  const breakdown = profile?.ratingBreakdown ?? [];
  const countOf = (s: number) => breakdown.find((x) => x.stars === s)?.count ?? 0;

  return (
    <Modal title={isTasker ? "Hồ sơ Tasker" : "Hồ sơ"} onClose={onClose}>
      {!profile && !error && <p className="hint">Đang tải hồ sơ…</p>}
      {error && (
        <div className="notice notice--danger" role="alert">
          {error}
        </div>
      )}
      {profile && (
        <div className="pub-profile">
          <div className="tasker-row">
            {avatar ? (
              <img className="avatar avatar--lg avatar--img" src={avatar} alt="" />
            ) : (
              <span className="avatar avatar--lg">{initials(profile.displayName)}</span>
            )}
            <div className="tasker-info">
              <b>{profile.displayName}</b>
              <span className="hint">
                {isTasker ? "Tasker" : "Khách hàng"} · Tham gia từ {monthYear(profile.memberSince)}
              </span>
              {isTasker && profile.isVerified && (
                <span className="pub-profile-verified">
                  <BadgeCheck size={14} /> Đã xác thực danh tính
                </span>
              )}
            </div>
          </div>

          <div className="pub-profile-stats">
            <div>
              <b>{profile.ratingAverage != null ? profile.ratingAverage.toFixed(1) : "—"}</b>
              <span>{profile.ratingAverage != null ? <Stars n={profile.ratingAverage} size={12} /> : "Chưa có điểm"}</span>
            </div>
            <div>
              <b>{profile.reviewCount}</b>
              <span>đánh giá</span>
            </div>
            <div>
              <b>{profile.completedBookings}</b>
              <span>đơn hoàn tất</span>
            </div>
          </div>

          {isTasker && ((profile.badges && profile.badges.length > 0) || profile.currentTop) && (
            <div className="pub-profile-badges">
              {profile.currentTop && (
                <span className="award-badge award-badge--live" title="Xếp hạng tạm tính, còn thay đổi đến hết tháng">
                  <TrendingUp size={13} /> {profile.currentTop.label}
                </span>
              )}
              {(profile.badges ?? []).map((x) => (
                <span key={`${x.year}-${x.month}`} className={`award-badge award-badge--r${Math.min(x.rank, 4)}`}>
                  <Trophy size={13} /> Hạng {x.rank} · {x.label}
                </span>
              ))}
            </div>
          )}

          {isTasker && (profile.workingArea || profile.skills) && (
            <div className="pub-profile-meta">
              {profile.workingArea && (
                <span>
                  <MapPin size={14} /> {profile.workingArea}
                </span>
              )}
              {profile.skills && <span>Kỹ năng: {profile.skills}</span>}
            </div>
          )}

          <h4 className="sub-h">Đánh giá ({profile.reviewCount})</h4>
          {profile.reviewCount > 0 && breakdown.length > 0 && (
            <div className="rating-summary">
              <div className="rating-summary-avg">
                <b>{profile.ratingAverage != null ? profile.ratingAverage.toFixed(1) : "—"}</b>
                <Stars n={profile.ratingAverage ?? 0} size={12} />
              </div>
              <div className="rating-summary-bars">
                {breakdown.map((s) => (
                  <button
                    key={s.stars}
                    type="button"
                    className="rating-bar"
                    disabled={s.count === 0}
                    onClick={() => pickStars(s.stars)}
                    title={`Xem đánh giá ${s.stars} sao`}
                  >
                    <span>{s.stars}★</span>
                    <i>
                      <em style={{ width: `${(s.count / Math.max(1, profile.reviewCount)) * 100}%` }} />
                    </i>
                    <span>{s.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {profile.reviewCount > profile.reviews.length && (
            <div className="chips review-filter" role="group" aria-label="Lọc theo số sao">
              <button type="button" className="chip" aria-pressed={stars === null} onClick={() => pickStars(null)}>
                Tất cả ({profile.reviewCount})
              </button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip"
                  aria-pressed={stars === s}
                  disabled={countOf(s) === 0}
                  onClick={() => pickStars(s)}
                >
                  {s}★ ({countOf(s)})
                </button>
              ))}
            </div>
          )}
          {reviewError && <p className="field-error">{reviewError}</p>}
          {shown.length === 0 ? (
            <p className="hint">{loadingReviews ? "Đang tải đánh giá…" : "Chưa có đánh giá nào."}</p>
          ) : (
            <ul className="reviews reviews--profile">
              {shown.map((r) => (
                <li key={r.id}>
                  <div className="review-head">
                    <b>{r.reviewerName}</b> <Stars n={r.rating} size={12} />
                    <span className="hint">{formatDate(r.createdAt)}</span>
                  </div>
                  <p>{r.comment || "Không có nhận xét"}</p>
                </li>
              ))}
            </ul>
          )}
          {shown.length < totalForFilter && (
            <button
              type="button"
              className="btn btn-outline btn-block review-more"
              disabled={loadingReviews}
              onClick={() => (list ? loadReviews(stars, page + 1) : pickStars(null))}
            >
              {loadingReviews ? "Đang tải…" : `Xem thêm đánh giá (${shown.length}/${totalForFilter})`}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
