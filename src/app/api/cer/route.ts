import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export async function GET(req: Request) {
    try {
        const { data, error } = await supabase
            .from('cer')
            .select('*')
            .order('fecha', { ascending: true });

        if (error) {
            console.error('Error fetching CER:', error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
        
        return new Response(JSON.stringify(data), { status: 200 });

    } catch (err) {
        console.error('Unexpected error:', err);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
