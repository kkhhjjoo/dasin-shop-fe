interface ProductOptionsProps {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}

export default function ProductOptions({ label, options, value, onChange }: ProductOptionsProps) {
  return (
    <div className="product-option">
      <label className="option-label">{label}</label>
      <select
        className="option-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">선택하세요</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
