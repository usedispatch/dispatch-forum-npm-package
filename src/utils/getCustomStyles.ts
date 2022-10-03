export function getCustomStyles(collectionID: string): string {
  let result = '';

  switch (collectionID) {
    case 'DSwfRF1jhhu6HpSuzaig1G19kzP73PfLZBPLofkw6fLD':
      result = 'degenApeAcademy';
      break;
    case 'B2qpsPkDVwS4ecDNNJ3jyzaLkXsPtpJcUnHdo9uBkrHy':
      result = 'metaplex';
      break;
    default:
      break;
  }

  return result;
}
