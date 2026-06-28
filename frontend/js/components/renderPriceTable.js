function renderPriceTableRow(item) {
  const trendClass = item.trend >= 0 ? 'trend-up' : 'trend-down';
  const trendArrow = item.trend >= 0 ? '&#9650;' : '&#9660;';

  return `
    <tr>
      <td><span class="crop-name">${item.cropEn}</span><br><span class="crop-hi">${item.cropHi}</span></td>
      <td>${item.mandi}</td>
      <td>${formatPriceWithUnit(item.price)}</td>
      <td class="${trendClass}">${trendArrow} ${Math.abs(item.trend)}%</td>
    </tr>`;
}