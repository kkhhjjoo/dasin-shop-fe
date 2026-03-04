export default function DeliveryInfo() {
  return (
    <div className="delivery-info">
      <h3>새벽배송</h3>
      <table className="info-table">
        <tbody>
          <tr>
            <th>출고일</th>
            <td>주 5일 출고(일,월,화,수,목)</td>
          </tr>
          <tr>
            <th>배송일</th>
            <td>출고 당일 밤 10시 ~ 다음날 오전 7시 전 도착</td>
          </tr>
          <tr>
            <th>배송지역</th>
            <td>서울 전역, 경기/인천 일부 지역</td>
          </tr>
        </tbody>
      </table>
      <h3>택배배송</h3>
      <table className="info-table">
        <tbody>
          <tr>
            <th>출고일</th>
            <td>주 5일 출고(일,월,화,수,목)</td>
          </tr>
          <tr>
            <th>배송일</th>
            <td>오전 10시까지 주문 시 다음날 도착</td>
          </tr>
          <tr>
            <th>배송지역</th>
            <td>전국, 제주 및 도서산간 지역</td>
          </tr>
        </tbody>
      </table>
      <p className="delivery-note">
        오늘출발 평일 오후 4시 까지 결제시 당일 출고됩니다.
      </p>
    </div>
  )
}
