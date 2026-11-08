import { useEffect, useState } from "react";
import { BadgeCheck, MapPin, Star, Trophy } from "lucide-react";
import Modal from "./Modal";
import { profileService } from "../services/bookingService";
import { getErrorMessage } from "../services/api";
import type { PublicProfile } from "../types";
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

  useEffect(() => {
    profileService
      .get(userId)
      .then(setProfile)
      .catch((e) => setError(getErrorMessage(e)));
  }, [userId]);

  const isTasker = profile?.role === 1;
  const avatar = mediaUrl(profile?.avatarUrl);

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

          {isTasker && profile.badges && profile.badges.length > 0 && (
            <div className="pub-profile-badges">
              {profile.badges.map((x) => (
                <span key={`${x.year}-${x.month}`} className={`award-badge award-badge--r${Math.min(x.rank, 4)}`}>
                  <Trophy size={13} /> {x.label} · hạng {x.rank}
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
          {profile.reviews.length === 0 ? (
            <p className="hint">Chưa có đánh giá nào.</p>
          ) : (
            <ul className="reviews reviews--profile">
              {profile.reviews.map((r) => (
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
        </div>
      )}
    </Modal>
  );
}
