type Props = {
  label: string;
  status?: string;
  detail: string;
};

function statusClass(status?: string) {
  if (!status) return "waiting";
  return status.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

export function MemoryTape({ label, status, detail }: Props) {
  return (
    <div className="memory-cassette" role="group" aria-label="Selected chat archive">
      <span className="memory-cassette__screw memory-cassette__screw--tl" aria-hidden="true" />
      <span className="memory-cassette__screw memory-cassette__screw--tr" aria-hidden="true" />
      <span className="memory-cassette__screw memory-cassette__screw--bl" aria-hidden="true" />
      <span className="memory-cassette__screw memory-cassette__screw--br" aria-hidden="true" />
      <div className="memory-cassette__sticker">
        <span className="memory-cassette__brand">MOONWITNESS / CHAT ARCHIVE</span>
        <strong title={label}>{label}</strong>
        <div className="memory-cassette__sticker-foot">
          <span>{detail}</span>
          <span className={"cassette-status cassette-status--" + statusClass(status)}>
            {status ? status.replaceAll("_", " ") : "AWAITING ARCHIVE"}
          </span>
        </div>
      </div>
      <div className="memory-cassette__window" aria-hidden="true">
        <div className="memory-cassette__reel">
          <i />
          <b />
          <i />
          <b />
          <i />
          <b />
          <i />
          <b />
        </div>
        <span className="memory-cassette__tape-path" />
        <div className="memory-cassette__reel">
          <i />
          <b />
          <i />
          <b />
          <i />
          <b />
          <i />
          <b />
        </div>
      </div>
      <div className="memory-cassette__lower" aria-hidden="true">
        <span>ORIGINAL SOURCE / PRESERVED</span>
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
