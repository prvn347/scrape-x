
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, TrendingUp, Hash, Clock, Globe, RefreshCw } from 'lucide-react'
import { motion } from "framer-motion"

export interface TrendData {
  scrapeId: string
  trend1: string
  trend2: string
  trend3: string
  trend4: string
  trend5: string
  timestamp: string
  ipAddress: string
  _id: string
  __v: number
}

export default function TrendScraper() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrendData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScrape = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("http://localhost:3000/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResult(data.data.data)
    } catch (err) {
      setError("Failed to scrape trends. " + err)
    } finally {
      setLoading(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <Card className="container max-w-2xl mx-auto backdrop-blur-sm bg-white/80">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <CardTitle>Twitter Trend Scraper</CardTitle>
          </div>
          <CardDescription>
            Discover what's trending on Twitter right now
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={handleScrape} 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Scraping Trends...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Scrape Twitter Trends
              </>
            )}
          </Button>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500 border border-red-200">
              {error}
            </div>
          )}

          {result && (
            <motion.div 
              className="space-y-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <Badge variant="outline" className="px-3 py-1">
                  <Hash className="h-3 w-3 mr-1" />
                  {result.scrapeId}
                </Badge>
              </div>

              <div className="grid gap-3">
                {[
                  result.trend1,
                  result.trend2,
                  result.trend3,
                  result.trend4,
                  result.trend5
                ].map((trend, index) => (
                  <motion.div 
                    key={index}
                    variants={item}
                    className="group"
                  >
                    <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
                      <CardContent className="p-4 flex items-center space-x-3">
                        <span className="text-2xl font-bold text-blue-500/20 group-hover:text-blue-500/40 transition-colors">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{trend}</span>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Separator />

              <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-gray-400" />
                  IP Address: {result.ipAddress}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  {new Date(result.timestamp).toLocaleString()}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

