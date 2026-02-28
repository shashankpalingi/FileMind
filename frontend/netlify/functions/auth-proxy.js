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

        response.headers.forEach((value, name) => {
            const lowerName = name.toLowerCase();
            if (lowerName === 'location') {
                // We must replace both plain and encoded versions of the Supabase URL
                let newValue = value;

                // Plain replacement
                newValue = newValue.split(supabaseUrl).join(netlifyUrl);

                // Encoded replacement (very important for Google redirect_uri)
                const encodedSupabase = encodeURIComponent(supabaseUrl);
                const encodedNetlify = encodeURIComponent(netlifyUrl);
                newValue = newValue.split(encodedSupabase).join(encodedNetlify);

                headers[name] = newValue;
            } else if (lowerName === 'set-cookie') {
                // Pass cookies through properly
                if (!headers['set-cookie']) headers['set-cookie'] = [];
                headers['set-cookie'].push(value);
            } else {
                headers[name] = value;
            }
        });

        return {
            statusCode: response.status,
            multiValueHeaders: headers['set-cookie'] ? { 'set-cookie': headers['set-cookie'] } : undefined,
            headers: { ...headers, 'set-cookie': undefined },
            body: await response.text(),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
