import style from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={style.footer}>
      <div className={style.footerInner}>
        <nav className={style.footerTopNav}>
          <a href="#">회사소개</a>
          <a href="#">채용정보</a>
          <a href="#">이용약관</a>
          <a href="#">개인정보 처리방침</a>
          <a href="#">청소년 보호정책</a>
          <a href="#">제휴/광고 문의</a>
          <a href="#">매장안내</a>
        </nav>

        <div className={style.footerBody}>
          <div className={style.footerBrand}>
            <div className={style.brandName}>DASINSHOP</div>
            <div className={style.companyInfo}>
              <div>
                <strong>㈜다신컴퍼니</strong>
              </div>
              <div>대표이사 : 김현주 / 서울특별시 어디구 어디로 123, 3층 다신컴퍼니</div>
              <div>사업자등록번호 : 000-00-00000 / 통신판매업 신고 : 2024-서울어디-0000</div>
              <div>전화번호 : 1644-0000 / E-mail : help@dasinshop.co.kr</div>
              <div>개인정보보호책임자 : 김현주</div>
            </div>
            <div className={style.footerCopy}>COPYRIGHT © DASINSHOP ALL RIGHTS RESERVED.</div>
          </div>

          <div className={style.footerRight}>
            <div className={style.csBox}>
              <div className={style.csTitle}>
                <span>고객센터 바로가기</span>
              </div>
              <div className={style.csTime}>
                <div>운영시간: 오전 10시 ~ 오후 5시 (주말·공휴일 휴무)</div>
                <div>점심시간: 오후 12시 30분 ~ 오후 1시 30분</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

