export const handler = async (event, context) => {
    const supabaseUrl = 'https://usxsjzobzjlfkpgymswm.supabase.co';
    const path = event.path.replace('/supabase', '');
    const url = `${supabaseUrl}${path}${event.rawQuery ? '?' + event.rawQuery : ''}`;

    // 1. Prepare Request Headers (Extremely Transparent)
    const requestHeaders = { ...event.headers };

    // Override host and origin to match Supabase
    requestHeaders['host'] = 'usxsjzobzjlfkpgymswm.supabase.co';
    if (requestHeaders['origin']) requestHeaders['origin'] = supabaseUrl;
    if (requestHeaders['referer']) requestHeaders['referer'] = supabaseUrl;

    const fetchOptions = {
        method: event.httpMethod,
        headers: requestHeaders,
        redirect: 'manual',
    };

    if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' && event.body) {
        fetchOptions.body = event.body;
    }

    try {
        const response = await fetch(url, fetchOptions);
        const headers = {};
        const netlifyUrl = 'https://filemind08.netlify.app/supabase';

        // Extract and rewrite headers
        response.headers.forEach((value, name) => {
            const lowerName = name.toLowerCase();
            if (lowerName === 'location') {
                let newValue = value;
                // Rewrite both plain and encoded URLs
                newValue = newValue.split(supabaseUrl).join(netlifyUrl);
                const encodedSupabase = encodeURIComponent(supabaseUrl);
                const encodedNetlify = encodeURIComponent(netlifyUrl);
                newValue = newValue.split(encodedSupabase).join(encodedNetlify);
                headers[name] = newValue;
            } else if (!['set-cookie', 'content-encoding', 'content-length', 'transfer-encoding'].includes(lowerName)) {
                headers[name] = value;
            }
        });

        // HANDLE COOKIES PROPERLY (Multi-value)
        // This is the key for session persistence
        let cookies = [];
        if (response.headers.getSetCookie) {
            cookies = response.headers.getSetCookie();
        } else if (response.headers.raw) {
            cookies = response.headers.raw()['set-cookie'] || [];
        }

        const processedCookies = cookies.map(c => {
            // Rewrite domain and path to make them first-party for Netlify
            return c
                .replace(/Domain=[^;]+;?/i, '')
                .replace(/Path=[^;]+;?/i, 'Path=/');
        });

        const responseText = await response.text();

        return {
            statusCode: response.status,
            multiValueHeaders: processedCookies.length > 0 ? { 'set-cookie': processedCookies } : {},
            headers: headers,
            body: responseText,
        };
    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Proxy failed to connect to Supabase' }),
        };
    }
};
