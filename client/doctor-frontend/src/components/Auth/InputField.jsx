function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  icon = null,
  rightSlot = null,
  error = '',
  helper = '',
  className = '',
  inputClassName = '',
  min,
  max,
  step,
  disabled = false,
  autoComplete,
  children,
  as = 'input',
  ...rest
}) {
  const hasError = Boolean(error);
  const commonClassName = `w-full min-h-[48px] rounded-2xl border px-4 py-3 text-sm text-white outline-none transition ${
    hasError
      ? 'border-rose-400/60 bg-rose-500/10 focus:border-rose-300 focus:ring-2 focus:ring-rose-300/30'
      : 'border-white/20 bg-white/10 focus:border-teal-300 focus:ring-2 focus:ring-teal-300/30'
  } ${icon ? 'pl-11' : ''} ${rightSlot ? 'pr-12' : ''} ${inputClassName}`;

  return (
    <label className={`block space-y-2 ${className}`} htmlFor={name}>
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
            {icon}
          </span>
        ) : null}

        {as === 'select' ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={commonClassName}
            disabled={disabled}
            autoComplete={autoComplete}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${name}-error` : helper ? `${name}-helper` : undefined}
            {...rest}
          >
            {children}
          </select>
        ) : as === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className={commonClassName}
            disabled={disabled}
            autoComplete={autoComplete}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${name}-error` : helper ? `${name}-helper` : undefined}
            {...rest}
          />
        ) : (
          <input
            id={name}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={commonClassName}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            autoComplete={autoComplete}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${name}-error` : helper ? `${name}-helper` : undefined}
            {...rest}
          />
        )}

        {rightSlot ? <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div> : null}
      </div>
      {helper && !hasError ? (
        <p id={`${name}-helper`} className="text-xs text-slate-400">
          {helper}
        </p>
      ) : null}
      {hasError ? (
        <p id={`${name}-error`} className="text-xs font-medium text-rose-300">
          {error}
        </p>
      ) : null}
    </label>
  );
}

export default InputField;
