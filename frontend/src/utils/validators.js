export const isValidPhone = (phone) => /^(\+229|00229)?[0-9]{8}$/.test(phone)
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)