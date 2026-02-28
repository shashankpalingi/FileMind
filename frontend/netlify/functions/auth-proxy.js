export const handler = async (event, context) => {
    const supabaseUrl = 'https://usxsjzobzjlfkpgymswm.supabase.co';
    const path = event.path.replace('/supabase', '');
    const url = `${supabaseUrl}${path}${event.rawQuery ? '?' + event.rawQuery : ''}`;

    try {
        const response = await fetch(url, {
            method: event.httpMethod,
            headers: {
                ...event.headers,
                host: 'usxsjzobzjlfkpgymswm.supabase.co',
            },
            body: event.body,
            redirect: 'manual', // Intercept redirects
        });

        const headers = {};
        response.headers.forEach((value, name) => {
            // Rewrite any location headers pointing to supabase
            if (name.toLowerCase() === 'location' && value.includes(supabaseUrl)) {
                headers[name] = value.split(supabaseUrl).join(process.env.URL || 'https://filemind08.netlify.app/supabase');
            } else {
                headers[name] = value;
            }
        });

        return {
            statusCode: response.status,
            headers: headers,
            body: await response.text(),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
