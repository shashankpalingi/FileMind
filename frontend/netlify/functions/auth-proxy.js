export const handler = async (event, context) => {
    const supabaseUrl = 'https://usxsjzobzjlfkpgymswm.supabase.co';
    const path = event.path.replace('/supabase', '');
    const url = `${supabaseUrl}${path}${event.rawQuery ? '?' + event.rawQuery : ''}`;

    const fetchOptions = {
        method: event.httpMethod,
        headers: {
            ...event.headers,
            host: 'usxsjzobzjlfkpgymswm.supabase.co',
        },
        redirect: 'manual', // Intercept redirects
    };

    if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' && event.body) {
        fetchOptions.body = event.body;
    }

    try {
        const response = await fetch(url, fetchOptions);

        const headers = {};
        const netlifyUrl = 'https://filemind08.netlify.app/supabase';
        const netlifyDomain = 'filemind08.netlify.app';

        response.headers.forEach((value, name) => {
            const lowerName = name.toLowerCase();
            if (lowerName === 'location') {
                let newValue = value;
                newValue = newValue.split(supabaseUrl).join(netlifyUrl);
                const encodedSupabase = encodeURIComponent(supabaseUrl);
                const encodedNetlify = encodeURIComponent(netlifyUrl);
                newValue = newValue.split(encodedSupabase).join(encodedNetlify);
                headers[name] = newValue;
            } else if (lowerName === 'set-cookie') {
                if (!headers['set-cookie']) headers['set-cookie'] = [];
                // Strip Domain and Secure to make it work on Netlify's domain
                let cookie = value.replace(/Domain=[^;]+;?/, '');
                // Also remove Secure if testing on local, but on Netlify it's fine.
                // However, we want the browser to accept it as a first-party cookie.
                headers['set-cookie'].push(cookie);
            } else if (lowerName !== 'content-encoding' && lowerName !== 'content-length' && lowerName !== 'transfer-encoding') {
                headers[name] = value;
            }
        });

        const responseText = await response.text();

        return {
            statusCode: response.status,
            multiValueHeaders: headers['set-cookie'] ? { 'set-cookie': headers['set-cookie'] } : {},
            headers: { ...headers, 'set-cookie': undefined },
            body: responseText,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
