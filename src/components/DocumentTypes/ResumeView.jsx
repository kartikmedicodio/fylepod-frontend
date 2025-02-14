import PropTypes from 'prop-types';

const ResumeView = ({ data }) => {
  if (!data) return null;

  const {
    firstName,
    middleName,
    lastName,
    mobileNumber,
    emailAddress,
    workExperience,
    educationHistory,
    address,
    additionalInfo
  } = data;

  const fullName = [firstName, middleName, lastName]
    .filter(name => name && name !== "null")
    .join(' ');

  const formatAddress = (addr) => {
    if (!addr) return null;
    const addressParts = [
      addr.floorAptSuite,
      addr.streetName,
      addr.streetNumber,
      addr.district,
      addr.city,
      addr.stateProvince,
      addr.country,
      addr.zipCode
    ].filter(part => part && part !== "null");
    
    return addressParts.length > 0 ? addressParts.join(', ') : null;
  };

  const formatLinks = (details) => {
    if (!details) return [];
    const linksRegex = /(linkedin\.com\/[^\s,]+|github\.com\/[^\s,]+)/g;
    return details.match(linksRegex) || [];
  };

  const formatSkills = (details) => {
    if (!details) return [];
    // Extract the Technical Skills section
    const skillsMatch = details.match(/Technical Skills: ([^,]+)/);
    if (skillsMatch && skillsMatch[1]) {
      return skillsMatch[1].split(', ').filter(Boolean);
    }
    return [];
  };

  const formatAchievements = (details) => {
    if (!details) return [];
    const achievementsMatch = details.match(/Achievements: (.+?)(?=, \w+:|\s*$)/);
    if (achievementsMatch && achievementsMatch[1]) {
      return achievementsMatch[1].split(', ').filter(Boolean);
    }
    return [];
  };

  const formatPositions = (details) => {
    if (!details) return [];
    const positionsMatch = details.match(/Positions of Responsibility: (.+?)(?=, \w+:|\s*$)/);
    if (positionsMatch && positionsMatch[1]) {
      return positionsMatch[1].split(', ').filter(Boolean);
    }
    return [];
  };

  const formattedAddress = formatAddress(address);
  const links = formatLinks(additionalInfo?.otherDetails);
  const skills = formatSkills(additionalInfo?.otherDetails);
  const achievements = formatAchievements(additionalInfo?.otherDetails);
  const positions = formatPositions(additionalInfo?.otherDetails);

  return (
    <div className="space-y-6">
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
          {emailAddress && emailAddress !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="font-medium">{emailAddress}</p>
            </div>
          )}
          {mobileNumber && mobileNumber !== "null" && (
            <div>
              <label className="text-sm text-gray-500">Phone</label>
              <p className="font-medium">{mobileNumber}</p>
            </div>
          )}
          {formattedAddress && (
            <div>
              <label className="text-sm text-gray-500">Address</label>
              <p className="font-medium">{formattedAddress}</p>
            </div>
          )}
        </div>
      </section>

      {/* Links */}
      {links.length > 0 && (
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Professional Links</h2>
          <div className="flex flex-wrap gap-3">
            {links.map((link, index) => (
              <a
                key={index}
                href={`https://${link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                {link}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {workExperience && workExperience.length > 0 && (
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Work Experience</h2>
          {workExperience.map((exp, index) => (
            <div key={index} className="mb-4 pb-4 border-b last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{exp.jobTitle}</h3>
                  <p className="text-gray-600">{exp.companyName}</p>
                </div>
                <p className="text-sm text-gray-500">
                  {exp.fromDate} - {exp.toDate}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {educationHistory && educationHistory.length > 0 && (
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Education</h2>
          {educationHistory.map((edu, index) => (
            <div key={index} className="mb-4 pb-4 border-b last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{edu.courseLevel}</h3>
                  <p className="text-gray-600">{edu.schoolUniversityCollege}</p>
                  {edu.specialization && edu.specialization !== "null" && (
                    <p className="text-sm text-gray-500">
                      Specialization: {edu.specialization}
                    </p>
                  )}
                  {edu.gpa && edu.gpa !== "null" && (
                    <p className="text-sm text-gray-500">
                      Score: {edu.gpa}
                    </p>
                  )}
                </div>
                {edu.passOutYear && edu.passOutYear !== "null" && (
                  <p className="text-sm text-gray-500">{edu.passOutYear}</p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Technical Skills */}
      {skills.length > 0 && (
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Technical Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Positions of Responsibility */}
      {positions.length > 0 && (
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Positions of Responsibility</h2>
          <ul className="list-disc list-inside space-y-2">
            {positions.map((position, index) => (
              <li key={index} className="text-gray-700">{position}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Achievements</h2>
          <ul className="list-disc list-inside space-y-2">
            {achievements.map((achievement, index) => (
              <li key={index} className="text-gray-700">{achievement}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

ResumeView.propTypes = {
  data: PropTypes.shape({
    firstName: PropTypes.string,
    middleName: PropTypes.string,
    lastName: PropTypes.string,
    mobileNumber: PropTypes.string,
    emailAddress: PropTypes.string,
    address: PropTypes.shape({
      floorAptSuite: PropTypes.string,
      streetName: PropTypes.string,
      streetNumber: PropTypes.string,
      district: PropTypes.string,
      city: PropTypes.string,
      stateProvince: PropTypes.string,
      country: PropTypes.string,
      zipCode: PropTypes.string
    }),
    workExperience: PropTypes.arrayOf(
      PropTypes.shape({
        jobTitle: PropTypes.string,
        companyName: PropTypes.string,
        fromDate: PropTypes.string,
        toDate: PropTypes.string
      })
    ),
    educationHistory: PropTypes.arrayOf(
      PropTypes.shape({
        schoolUniversityCollege: PropTypes.string,
        courseLevel: PropTypes.string,
        specialization: PropTypes.string,
        gpa: PropTypes.string,
        passOutYear: PropTypes.string
      })
    ),
    additionalInfo: PropTypes.shape({
      otherDetails: PropTypes.string
    })
  }).isRequired
};

export default ResumeView; 