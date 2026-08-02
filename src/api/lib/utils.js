const numberParse = (num) => {
  const val = parseInt(num)
  if (isNaN(val)) return '-'
  return String(val).replace(/(.)(?=(\d{3})+$)/g, '$1,')
}

const getUnsubsURL = (id, context) => {
  const url = ShortBaseURL + '/off/' + id
  if (context) {
    return `${url}?ctx=${context}`
  }
  return url
}

module.exports = {
  numberParse,
  getUnsubsURL,
}
