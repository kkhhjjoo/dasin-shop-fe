const CATEGORIES = [
  '전체 카테고리',
  '찐살복구 특가',
  'BEST',
  'SALE',
  'NEW',
  '식단프로그램',
  '무료배송',
  '이벤트&쿠폰',
]

export default function Nav() {
  return (
    <nav className="main-nav">
      <div className="container">
        <ul className="nav-list">
          {CATEGORIES.map((item) => (
            <li key={item}>
              <a href="#">{item}</a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
