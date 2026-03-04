import { useState } from 'react'
import ProductOptions from './ProductOptions'
import DeliveryInfo from './DeliveryInfo'
import ProductTabs from './ProductTabs'

const FLAVORS = [
  '★혼합 7종 15팩★',
  '오리지널 15팩',
  '청양바베큐 15팩',
  '탄두리 15팩',
  '마살라커리 15팩',
  '불닭 15팩',
  '닭갈비 15팩',
  '안동찜닭 15팩',
]

export default function ProductDetail() {
  const [option1, setOption1] = useState('')
  const [option2, setOption2] = useState('')
  const totalPrice = 0 // 옵션 선택 시 계산

  return (
    <div className="product-detail">
      <div className="container">
        <p className="breadcrumb">
          <a href="#">닭가슴살·치킨</a>
        </p>

        <div className="product-layout">
          <div className="product-gallery">
            <div className="product-image-placeholder">
              <img width={400} height={400} src="/15+15.png" alt="15+15 닭가슴살" />
            </div>
            <div className="share-buttons">
              <button type="button">카카오톡</button>
              <button type="button">페이스북</button>
              <button type="button">링크복사</button>
            </div>
          </div>

          <div className="product-info">
            <span className="badge-free-ship">무료배송</span>
            <h1 className="product-title">
              [15+15 특가] 닭신 오븐구이 닭안심살 7종 골라담기
            </h1>
            <p className="product-subtitle">
              (1팩 1,980원) 스팀오븐으로 구운 쫄깃하고 촉촉한 특수부위 닭안심살
            </p>

            <div className="product-price-wrap">
              <span className="label">판매가격</span>
              <div className="price-row">
                <strong className="price-sale">59,400원</strong>
                <span className="price-original">120,000원</span>
                <span className="discount-rate">51%</span>
              </div>
            </div>

            <div className="product-meta">
              <p>적립금 예상적립금 0원 (실 결제금액의 1%) 로그인, 옵션 선택 후 적립금 확인 가능합니다.</p>
              <p><strong>배송정보</strong> 묶음배송 (무료) · 다신배송_냉동 · 롯데택배</p>
            </div>

            <ProductOptions
              label="[필수옵션1] 15+15 특가"
              options={FLAVORS}
              value={option1}
              onChange={setOption1}
            />
            <ProductOptions
              label="[필수옵션2] 15+15 특가"
              options={FLAVORS}
              value={option2}
              onChange={setOption2}
            />

            <div className="product-total">
              <span>총 상품금액</span>
              <strong>{totalPrice > 0 ? `${totalPrice.toLocaleString()}원` : '0원'}</strong>
            </div>

            <div className="product-actions">
              <button type="button" className="btn-cart">장바구니 담기</button>
              <button type="button" className="btn-buy">구매하기</button>
            </div>

            <DeliveryInfo />
          </div>
        </div>

        <ProductTabs />
      </div>
    </div>
  )
}
