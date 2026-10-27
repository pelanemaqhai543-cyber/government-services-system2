
const findApplication = require('../utils/findApplication');

exports.evaluateApplication = async (req, res) => {
  try {
    const identifier =
      req.body.applicationId ??
      req.body.referenceNumber;

    const application = await findApplication(identifier);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found. Check its ID or reference number.'
      });
    }

    const checks = [
      {
        name: 'Application record',
        passed: true,
        message: 'Application record exists.'
      },
      {
        name: 'Application reference',
        passed: Boolean(application.reference_number),
        message: application.reference_number
          ? 'Application reference is present.'
          : 'Reference requires verification.'
      },
      {
        name: 'Application status',
        passed: Boolean(application.status),
        message: application.status
          ? `Current status: ${application.status}`
          : 'Status requires verification.'
      },
      {
        name: 'Supporting documents',
        passed: null,
        message: 'Officer must verify the required documents.'
      },
      {
        name: 'Eligibility',
        passed: null,
        message: 'Officer must verify eligibility.'
      }
    ];

    return res.json({
      success: true,
      applicationId: application.id,
      referenceNumber: application.reference_number,
      serviceType: application.service_type,
      checks,
      decision: 'Officer decision required',
      disclaimer:
        'These checks are advisory only. Do not automatically approve or reject applications.'
    });
  } catch (error) {
    console.error('Rules evaluation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to evaluate the application.'
    });
  }
};
