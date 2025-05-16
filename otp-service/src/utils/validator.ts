export const isValidEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    console.log(emailRegex.test(email));
    console.log("email: ",email);

    const [localPart, domain] = email.split("@");

    if (!localPart || !domain) return false;

    console.log("localPart: ",localPart);
    console.log("domain: ",domain);

    const allowedDomains = process.env.ALLOWED_DOMAINS
        ? process.env.ALLOWED_DOMAINS.split(",")
        : [];

    const minLocalPartLength = 5;
    const maxLocalPartLength = 64;

    return (
        (allowedDomains.length === 0 || allowedDomains.includes(domain)) &&
        localPart.length >= minLocalPartLength &&
        localPart.length <= maxLocalPartLength &&
        emailRegex.test(email)
    );
};
