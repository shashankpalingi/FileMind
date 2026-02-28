export const handler = async (event, context) => {
    const supabaseUrl = 'https://usxsjzobzjlfkpgymswm.supabase.co';
    const path = event.path.replace('/supabase', '');
    const url = `${supabaseUrl}${path}${event.rawQuery ? '?' + event.rawQuery : ''}`;

    // Use multiValueHeaders for incoming request to catch all cookies
    const requestHeaders = {};
    Object.keys(event.multiValueHeaders || {}).forEach(key => {
        requestHeaders[key.toLowerCase()] = event.multiValueHeaders[key].join('; ');
    });

    // Override host and handle origins
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
        const rawCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
        const processedCookies = rawCookies.map(cookie => {
            return cookie
                .replace(/Domain=[^;]+;?/, '')
                .replace(/Path=[^;]+;?/, 'Path=/');
        });

        const responseText = await response.text();

        return {
            statusCode: response.status,
            multiValueHeaders: processedCookies.length > 0 ? { 'set-cookie': processedCookies } : {},
            headers: headers,
            body: responseText,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
