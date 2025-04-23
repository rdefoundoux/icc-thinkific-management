// frontend/src/components/ThinkificIcon.jsx
export const ThinkificIcon = ({ size = 24, color = '#2C3E50' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM16.4031 15.5846L13.1999 10.8L16.4031 6H14.1428L11.5999 10.0492L9.05699 6H6.79673L10 10.8L6.79673 15.6H9.05699L11.5999 11.5508L14.1428 15.6H16.4031V15.5846Z"
            fill={color}
        />
    </svg>
);
