import { getLatestNews } from '@/lib/data'

import { NewsFeed } from '@/components/news/NewsFeed'

import { Metadata } from 'next'



export const metadata: Metadata = {

    title: 'News | Talir',

    description: 'Filings and disclosures from companies listed on the Macedonian Stock Exchange',

}



export const revalidate = 86400



export default async function NewsPage() {

    const news = await getLatestNews(20)



    return (

        <main className="max-w-7xl mx-auto min-w-0 animate-in fade-in duration-500">

            <div className="flex flex-col gap-6">

                <header className="flex flex-col gap-2">

                    <h1 className="text-2xl sm:text-3xl font-semibold font-heading text-text-primary tracking-tight">

                        MSE Market News

                    </h1>

                    <p className="text-text-secondary text-sm">

                        Filings and disclosures from companies listed on the Macedonian Stock Exchange.

                    </p>

                </header>



                <NewsFeed items={news} layout="page" showHeader={false} />

            </div>

        </main>

    )

}


