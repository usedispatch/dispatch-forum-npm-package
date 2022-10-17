export function getCustomStyles(collectionID: string): string {
  let result = '';

  switch (collectionID) {
    case 'DSwfRF1jhhu6HpSuzaig1G19kzP73PfLZBPLofkw6fLD':
      result = 'degenApeAcademy';
      break;
    case 'B2qpsPkDVwS4ecDNNJ3jyzaLkXsPtpJcUnHdo9uBkrHy':
      result = 'metaplex';
      break;
    case '6ThcrupJDDxxKKsDdGy1xjEkZdrZGsjt33B6iyK8VhP9':
      result = 'solana';
      break;
    default:
      break;
  }

  return result;
}
