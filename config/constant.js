const MIDDLEWARE_AUTH_CONSTANTS = {
    ACCESS_DENIED: "Access denied.",
    RESOURCE_FORBIDDEN: "You don't have access to the request resource.",
    INVALID_AUTH_TOKEN: "Invalid token.",
};

const AUTH_CONSTANTS = {
    SYSTEM_FAILURE: "Something failed.",
    NO_ACCESS: MIDDLEWARE_AUTH_CONSTANTS.ACCESS_DENIED,
    INVALID_USER: "User not found.",
    INACTIVE_ACCOUNT: "This account is not active. Please contact admin.",
    BLOCKED_ACCOUNT: "This account has been rejected or blocked. Please contact admin.",
    INVALID_CREDENTIALS: "Invalid email or password.",
    INVALID_PASSWORD: "You have entered incorrect password. Please try again with valid password.",
    INVALID_RECOVERY_LINK: "Password link is expired or not valid.",
    PASSWORD_CHANGE_SUCCESS: "Password changed successfully.",
    CHANGE_PASSWORD_REQUEST_SUCCESS: "Password recovery link has been sent to your registered email.",
    CHANGE_PASSWORD_REQUEST_EMAIL_FAILURE: "Email sending failed. Please try again.",
    INVALID_EMAIL: "This email is not registered. Please sign up to continue.",
    INVALID_MOBILE: "This mobile number is not registered. Please sihgn up to continue.",
};

const USER_CONSTANTS = {
    USER_CREATED_SUCCESS: "User created successfully.",
    LOGIN_SUCCESS: "Logged in successfully.",
    VIEW_PROFILE_SUCCESS: "You are currently viewing your profile",
    EDIT_PROFILE_SUCCESS: "Your profile has been updated successfully.",
    NO_USER_FOUND_EMAIL: "No user found with this email.",
    PASSWORD_RESET_SUCCESS: "Your password has been successfully reset.",
    VALID_TOKEN_SUCCESS: "The token provided is valid.",
    LOGOUT_SUCCESSFULLY: "Logged out successfully.",
    EMAIL_ALREADY_EXISTS: "This email is already registered.",
    MOBILE_ALREADY_EXISTS: "This mobile number is already registerd.",
    USER_ALREADY_EXISTS: "User already exists with these details.",
    VERIFICATION_EMAIL_SUCCESS: "This email has been sucessfully verified.",
    DASHBOARD_VIEW: "You are currently viewing your dashboard.",
    NOT_FOUND: "User not found.",
    PASSWORD_CHANGE_SUCCESS: "Password changes successfully.",
    INVALID_OLD_PASSWORD: "Incorrect old password.",
    ONLY_EXPORTER_CONTRACT: "Not allowed. Only an exporter can send contract to the admin."
};

const FILE_UPLOAD_CONSTANTS = {
    IMAGE_UPLOAD_SUCCESS: "Image file uploaded successfully.",
    FILE_UPLOAD_SUCCESS: "File uploaded successfully.",
    FILE_EXPORT_SUCCESS: "File exported successfully.",
    MOBILE_ALREADY_EXISTS: "Contact already exists."
};

const OTP_CONSTANTS = {
    INVALID_OTP: "OTP is not valid.",
    NO_USER_REGISTERED_EMAIL: "No user registered with this email.",
    DUPLICATE_MOBILE_NUMBER: "Mobile number entered is already registered. Please try to login.",
    DUPLICATE_EMAIL: "Email entered is already registered. Please try to login.",
    INVALID_MOBILE_NUMBER: "Invalid mobile number entered. Please provide valid mobile number.",
    INVALID_EMAIL: "Invalid email address entered. Please provide valid email.",
    EMAIL_SENDING_FAILED: "Email sending failed due to some application issue.",
    OTP_GENERATED: "Verification code generated successfully.",
    OTP_VERIFIED: "OTP verification success.",
    INVALID_OTP: "Invalid Code.",
    OTP_MAX_LIMIT_ERROR: "Max attempts to verify code breached.",
    OTP_EXPIRED: "Verification code expired.",
    OTP_VERIFIED_NEW_USER: "Verification code verified for new user.",
    PLEASE_VERIFY: "Please enter OTP for verification.",
};

const PRODUCT_CONSTANTS = {
    PRODUCT_ALREADY_EXISTS: "Product already exists with these details.",
    NOT_FOUND: "Product not found.",
    PRODUCT_DELETED: "Product deleted successfully.",
    PRODUCT_CREATED_SUCCESS: "Product created successfully.",
    VIEW_PRODUCT: "You are currently viewing Product list.",
    EDIT_PRODUCT: "You have successfully updated this Product.",
    STATUS_CHANGED: "Status has been changed successfully.",
};

const CATEGORY_CONSTANTS = {
    CATEGORY_ALREADY_EXISTS: "Category already exists.",
    NOT_FOUND: "Category not found.",
    CATEGORY_DELETED: "Category deleted successfully.",
    CATEGORY_CREATED_SUCCESS: "Category created successfully.",
    VIEW_CATEGORY: "You are currently viewing category list.",
    EDIT_CATEGORY: "You have successfully updated this category.",
};

const CONTRACT_CONSTANTS = {
    CONTRACT_ALREADY_EXISTS: "Contract already exists.",
    NOT_FOUND: "Contract not found.",
    CONTRACT_DELETED: "Contract deleted successfully.",
    CONTRACT_CREATED_SUCCESS: "Contract request sent to the admin successfully.",
    VIEW_CONTRACT: "You are currently viewing contract list.",
    EDIT_CONTRACT: "You have successfully updated this contract.",
    INVALID_STATUS_PROVIDED: "Invalid status provided. Use 'approved' or 'rejected'.",
    CONTRACT_APPROVED: "Contract request is approved.",
    CONTRACT_REJECTED: "Contract request is rejected."
};

const PARENT_CONSTANTS = {
    PARENT_ALREADY_EXISTS: "Parent already exists for this student.",
    EMAIL_ALREADY_EXISTS: "Email already exists",
    MOBILE_ALREADY_EXISTS: "Phone number already exists",
    NOT_FOUND: "Parent not found.",
    PARENT_DELETED: "Parent deleted successfully.",
    PARENT_CREATED_SUCCESS: "Parent created successfully.",
    VIEW_PARENT: "You are currently viewing Parent list.",
    EDIT_PARENT: "You have successfully updated this Parent.",
    AT_LEAST_ONE_REQUIRED: 'At least one of emails, motherPhoneNo, or fatherPhoneNo is required.'
};




module.exports = {
    MIDDLEWARE_AUTH_CONSTANTS,
    AUTH_CONSTANTS,
    OTP_CONSTANTS,
    USER_CONSTANTS,
    FILE_UPLOAD_CONSTANTS,
    PRODUCT_CONSTANTS,
    CATEGORY_CONSTANTS,
    CONTRACT_CONSTANTS,

    PARENT_CONSTANTS,
}