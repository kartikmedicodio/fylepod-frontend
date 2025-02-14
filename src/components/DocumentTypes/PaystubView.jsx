import PropTypes from 'prop-types';

const PaystubView = ({ data }) => {
  if (!data) return null;

  const {
    firstName,
    middleName,
    lastName,
    companyName,
    companyAddress,
    jobTitle,
    paySchedule,
    payDate,
    grossPay,
    netPay,
    additionalInfo
  } = data;

  const fullName = [firstName, middleName, lastName]
    .filter(name => name && name !== "null")
    .join(' ');

  // Parse additional info
  const parseAdditionalInfo = (details) => {
    if (!details) return {};
    
    const info = {};
    details.split(', ').forEach(item => {
      const [key, value] = item.split(': ');
      if (key && value) {
        info[key.trim()] = value.trim();
      }
    });
    return info;
  };

  const additionalDetails = parseAdditionalInfo(additionalInfo?.otherDetails);

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Company Information</h2>
        <div className="space-y-4">
          {companyName && companyName !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Company Name</label>
              <p className="font-medium">{companyName}</p>
            </div>
          )}
          {companyAddress && companyAddress !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Company Address</label>
              <p className="font-medium">{companyAddress}</p>
            </div>
          )}
        </div>
      </section>

      {/* Employee Information */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Employee Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {fullName && (
            <div>
              <label className="text-sm text-gray-500">Employee Name</label>
              <p className="font-medium">{fullName}</p>
            </div>
          )}
          {jobTitle && jobTitle !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Job Title</label>
              <p className="font-medium">{jobTitle}</p>
            </div>
          )}
        </div>
      </section>

      {/* Pay Period Information */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Pay Period Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {additionalDetails['Pay Period'] && (
            <div>
              <label className="text-sm text-gray-500">Pay Period</label>
              <p className="font-medium">{additionalDetails['Pay Period']}</p>
            </div>
          )}
          {payDate && payDate !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Pay Date</label>
              <p className="font-medium">{payDate}</p>
            </div>
          )}
          {paySchedule && paySchedule !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Pay Schedule</label>
              <p className="font-medium">{paySchedule}</p>
            </div>
          )}
        </div>
      </section>

      {/* Earnings */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Earnings</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {additionalDetails['Hours'] && (
              <div>
                <label className="text-sm text-gray-500">Hours Worked</label>
                <p className="font-medium">{additionalDetails['Hours']}</p>
              </div>
            )}
            {additionalDetails['Rate'] && (
              <div>
                <label className="text-sm text-gray-500">Hourly Rate</label>
                <p className="font-medium">${additionalDetails['Rate']}</p>
              </div>
            )}
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm text-gray-500">Gross Pay</label>
                <p className="font-medium">${grossPay || '0.00'}</p>
              </div>
              {additionalDetails['YTD Gross Pay'] && (
                <div className="text-right">
                  <label className="text-sm text-gray-500">YTD Gross Pay</label>
                  <p className="font-medium">${additionalDetails['YTD Gross Pay']}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Net Pay */}
      <section className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Net Pay</h2>
          <span className="text-2xl font-bold text-primary-600">
            ${netPay || '0.00'}
          </span>
        </div>
      </section>
    </div>
  );
};

PaystubView.propTypes = {
  data: PropTypes.shape({
    firstName: PropTypes.string,
    middleName: PropTypes.string,
    lastName: PropTypes.string,
    companyName: PropTypes.string,
    companyAddress: PropTypes.string,
    jobTitle: PropTypes.string,
    paySchedule: PropTypes.string,
    payDate: PropTypes.string,
    grossPay: PropTypes.string,
    netPay: PropTypes.string,
    additionalInfo: PropTypes.shape({
      otherDetails: PropTypes.string
    })
  }).isRequired
};

export default PaystubView; 