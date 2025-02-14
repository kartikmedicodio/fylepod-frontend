import PropTypes from 'prop-types';

const NationalIDView = ({ data }) => {
  if (!data) return null;

  const {
    firstName,
    middleName,
    lastName,
    sex,
    dateOfBirth,
    nationality,
    idNumber,
    dateOfIssue,
    dateOfExpiry,
    additionalInfo
  } = data;

  const fullName = [firstName, middleName, lastName]
    .filter(name => name && name !== "null")
    .join(' ');

  return (
    <div className="space-y-6">
      {/* ID Card Information */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">ID Card Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {idNumber && idNumber !== "null" && (
            <div>
              <label className="text-sm text-gray-500">ID Number</label>
              <p className="font-medium">{idNumber}</p>
            </div>
          )}
          {nationality && nationality !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Nationality</label>
              <p className="font-medium">{nationality}</p>
            </div>
          )}
        </div>
      </section>

      {/* Personal Information */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {fullName && (
            <div>
              <label className="text-sm text-gray-500">Full Name</label>
              <p className="font-medium">{fullName}</p>
            </div>
          )}
          {sex && sex !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Gender</label>
              <p className="font-medium">{sex}</p>
            </div>
          )}
          {dateOfBirth && dateOfBirth !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Date of Birth</label>
              <p className="font-medium">{dateOfBirth}</p>
            </div>
          )}
        </div>
      </section>

      {/* Validity Information */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Validity Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {dateOfIssue && dateOfIssue !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Date of Issue</label>
              <p className="font-medium">{dateOfIssue}</p>
            </div>
          )}
          {dateOfExpiry && dateOfExpiry !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Date of Expiry</label>
              <p className="font-medium">{dateOfExpiry}</p>
            </div>
          )}
        </div>
      </section>

      {/* Additional Information */}
      {additionalInfo?.otherDetails && additionalInfo.otherDetails !== "null" && (
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
          <p className="text-gray-700">{additionalInfo.otherDetails}</p>
        </section>
      )}
    </div>
  );
};

NationalIDView.propTypes = {
  data: PropTypes.shape({
    firstName: PropTypes.string,
    middleName: PropTypes.string,
    lastName: PropTypes.string,
    sex: PropTypes.string,
    dateOfBirth: PropTypes.string,
    nationality: PropTypes.string,
    idNumber: PropTypes.string,
    dateOfIssue: PropTypes.string,
    dateOfExpiry: PropTypes.string,
    additionalInfo: PropTypes.shape({
      otherDetails: PropTypes.string
    })
  }).isRequired
};

export default NationalIDView; 