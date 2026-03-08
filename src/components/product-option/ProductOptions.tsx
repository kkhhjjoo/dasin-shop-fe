import styles from './product-options.module.css';

interface ProductOptionsProps {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}

export default function ProductOptions({ label, options, value, onChange }: ProductOptionsProps) {
  return (
    <div className={styles.productOption}>
      <label className={styles.optionLabel}>{label}</label>
      <select
        className={styles.optionSelect}
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
