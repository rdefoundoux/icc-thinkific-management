import {Button} from "@mantine/core";
import {useParams} from "react-router-dom";

const ThinkificLoginButton = () => {
    const { subdomain } = useParams();

    return (
        <Button
            component="a"
            href={`https://${subdomain}.thinkific.com/oauth2/authorize?client_id=${THINKIFIC_CLIENT_ID}&response_type=code&redirect_uri=${window.location.origin}/callback`}
        >
            Login with Thinkific
        </Button>
    );
};
