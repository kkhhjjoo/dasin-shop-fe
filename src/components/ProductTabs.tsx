import { useState } from 'react'

const TABS = [
  { id: 'detail', label: '상세설명' },
  { id: 'purchase', label: '구매정보' },
  { id: 'reviews', label: '상품후기(17019)' },
  { id: 'spec', label: '제품정보' },
]

const SAMPLE_REVIEWS = [
  { author: '카****', rating: 5, text: '닭가슴살보다 더 촉촉하고 너무 맛있었어요 ㅠㅠ' },
  { author: '코로롱**', rating: 5, text: '남편과 함께 건강관리차 주문해서 먹는데 하나같이 다 맛있네요ㅋㅋ' },
  { author: '네****', rating: 5, text: '오리지널하고 탄투리 맛있네요~! 종류별로 사서 매일 땡기는거로 골라 먹어요' },
]

export default function ProductTabs() {
  const [activeTab, setActiveTab] = useState('detail')

  return (
    <div className="product-tabs">
      <ul className="tab-list">
        {TABS.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="tab-content">
        {activeTab === 'detail' && (
          <div className="tab-panel">
            <p>상세설명 영역입니다. 실제 상품 이미지와 설명이 들어갑니다.</p>
          </div>
        )}
        {activeTab === 'purchase' && (
          <div className="tab-panel">
            <h4>배송 안내</h4>
            <p>다신 배송 상품(상온/냉동), 입점사 상품 구분 없이 주문 당 배송비는 한 번만 발생합니다.</p>
            <p>최소 구매 금액 1만원부터 주문하실 수 있습니다.</p>
          </div>
        )}
        {activeTab === 'reviews' && (
          <div className="tab-panel">
            <div className="reviews-summary">
              <span>사용자 총 평점 <strong>4.9</strong></span>
              <span>17,019건의 후기 중 93% 고객이 5점을 주었어요.</span>
            </div>
            <ul className="review-list">
              {SAMPLE_REVIEWS.map((r, i) => (
                <li key={i} className="review-item">
                  <div className="review-meta">
                    <span className="author">{r.author}</span>
                    <span className="rating">{'★'.repeat(r.rating)}</span>
                  </div>
                  <p>{r.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {activeTab === 'spec' && (
          <div className="tab-panel">
            <p>닭신 오븐구이 닭안심살 제품정보 (영양성분, 원재료 등)</p>
          </div>
        )}
      </div>
    </div>
  )
}
