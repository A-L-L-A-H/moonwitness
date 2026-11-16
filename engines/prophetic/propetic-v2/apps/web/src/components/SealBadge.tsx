import { useI18n } from "../i18n";

export function SealBadge() {
  const { t } = useI18n();
  return (
    <div className="seal-badge">
      <div className="seal-badge-icon">✧</div>
      <div>
        <div className="seal-badge-title">{t("muhammad.sealBadge")}</div>
        <div className="seal-badge-desc">{t("muhammad.sealDesc")}</div>
      </div>
    </div>
  );
}
