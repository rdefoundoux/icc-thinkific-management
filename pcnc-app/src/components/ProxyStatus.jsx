import { useEffect, useState } from 'react';
import { Group, Progress, Text } from '@mantine/core';

export default function ProxyStatus() {
    const [status, setStatus] = useState([]);

    useEffect(() => {
        fetch('/api/proxies/status')
            .then(res => res.json())
            .then(setStatus);
    }, []);

    return (
        <Group>
            {status.map(pool => (
                <div key={pool.role}>
                    <Text>{pool.role}</Text>
                    <Progress value={(pool.active / pool.total) * 100} />
                    <Text>Active: {pool.active}/{pool.total}</Text>
                </div>
            ))}
        </Group>
    );
}
