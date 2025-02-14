import React from 'react';
import PropTypes from 'prop-types';

const PassportView = ({ data }) => {
  if (!data) return null;

  const {
    firstName,
    middleName,
    lastName,
    nationality,
    sex,
    city,
    country,
    dateOfBirth,
    passportNumber,
    dateOfIssue,
    dateOfExpiry,
    placeOfIssue,
    issuedBy,
    passportType,
    additionalInfo
  } = data;

  const fullName = [firstName, middleName, lastName]
    .filter(name => name && name !== "null")
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Passport Information */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Passport Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {passportNumber && passportNumber !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Passport Number</label>
              <p className="font-medium">{passportNumber}</p>
            </div>
          )}
          {passportType && passportType !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Type</label>
              <p className="font-medium">{passportType}</p>
            </div>
          )}
          {issuedBy && issuedBy !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Issuing Country</label>
              <p className="font-medium">{issuedBy}</p>
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
          {(city || country) && (
            <div>
              <label className="text-sm text-gray-500">Place of Birth</label>
              <p className="font-medium">
                {[city, country].filter(item => item && item !== "null").join(', ')}
              </p>
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
          {placeOfIssue && placeOfIssue !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Place of Issue</label>
              <p className="font-medium">{placeOfIssue}</p>
            </div>
          )}
        </div>
      </section>

      {/* Additional Information */}
      {data.additionalInfo?.otherDetails && data.additionalInfo.otherDetails !== "null" && (
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
          <p className="text-gray-700">{data.additionalInfo.otherDetails}</p>
        </section>
      )}
    </div>
  );
};

PassportView.propTypes = {
  data: PropTypes.shape({
    firstName: PropTypes.string,
    middleName: PropTypes.string,
    lastName: PropTypes.string,
    nationality: PropTypes.string,
    sex: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
    dateOfBirth: PropTypes.string,
    passportNumber: PropTypes.string,
    dateOfIssue: PropTypes.string,
    dateOfExpiry: PropTypes.string,
    placeOfIssue: PropTypes.string,
    issuedBy: PropTypes.string,
    passportType: PropTypes.string,
    additionalInfo: PropTypes.shape({
      otherDetails: PropTypes.string
    })
  }).isRequired
};

export default PassportView; 