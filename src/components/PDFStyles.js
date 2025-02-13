import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    fontSize: 16,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
  },
  subHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottom: 1,
    borderBottomColor: '#eee',
    paddingBottom: 4,
  },
  label: {
    width: '40%',
    fontSize: 11,
    fontWeight: 'bold',
  },
  value: {
    width: '60%',
    fontSize: 11,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginBottom: 10,
  },
  indentedRow: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottom: 1,
    borderBottomColor: '#eee',
    paddingBottom: 4,
    paddingLeft: 20,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 10,
  }
}); 