function StatusCard({ title, value, description }) {
  return (
    <article className="status-card">
      <p className="status-card__label">{title}</p>
      <h3>{value}</h3>
      <p className="status-card__description">{description}</p>
    </article>
  );
}

export default StatusCard;
