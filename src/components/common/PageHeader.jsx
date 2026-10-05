function PageHeader({
  icon,
  title,
  description,
  action,
}) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <div className="page-header-icon">
          {icon}
        </div>

        <div className="page-header-text">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      {action && (
        <div className="page-header-action">
          {action}
        </div>
      )}
    </div>
  );
}

export default PageHeader;