import styles from './nav.module.css';

const CATEGORIES = ['전체 카테고리', 'BEST', 'SALE', 'NEW', '식단프로그램', '이벤트&쿠폰'];

export default function Nav() {
  return (
    <nav className={styles.mainNav}>
      <div className="container">
        <ul className={styles.navList}>
          {CATEGORIES.map((item) => (
            <li key={item}>
              <a href="#">{item}</a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
