import style from './Intro.module.css';

export default function Intro() {
  return (
    <div className={style.introRoot}>
      <div className={style.introLogo}>
        <div className={style.introMark}>
          <div className={style.introDash} />
        </div>
        <div className={style.introText}>DASHIN</div>
      </div>
    </div>
  );
}

