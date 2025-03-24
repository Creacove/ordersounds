
import React, { useState } from "react";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Play, Search, Filter, ChevronRight, Music, Star, Sparkles, Library, Clock, Calendar, Tag, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Collections() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { trendingBeats } = useBeats();
  const [activeTab, setActiveTab] = useState("featured");
  
  // Mock collections data for presentation
  const featuredCollections = [
    { 
      id: 'piano', 
      title: 'Piano Vibes', 
      description: 'Smooth piano-led beats with soul and atmosphere',
      color: 'from-blue-500 to-purple-500', 
      image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      curator: 'JUNE',
      curatorAvatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      trackCount: 18,
      featured: true,
      tags: ['Melodic', 'Piano', 'Chill'],
      date: 'Updated 3 days ago'
    },
    { 
      id: 'guitar', 
      title: 'Guitar Classics', 
      description: 'Soulful guitar-driven beats with warm tones',
      color: 'from-orange-500 to-red-500', 
      image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      curator: 'Metro Boomin',
      curatorAvatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      trackCount: 12,
      featured: true,
      tags: ['Guitar', 'Acoustic', 'Soul'],
      date: 'Updated 1 week ago'
    },
    { 
      id: 'afro', 
      title: 'Afro Fusion', 
      description: 'The perfect blend of Afrobeat rhythms and modern production',
      color: 'from-green-500 to-emerald-500', 
      image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      curator: 'DJ Eazie',
      curatorAvatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      trackCount: 24,
      featured: true,
      tags: ['Afrobeat', 'Fusion', 'Dance'],
      date: 'Updated 5 days ago'
    },
    { 
      id: 'rnb', 
      title: 'Smooth R&B', 
      description: 'Contemporary R&B beats with lush harmonies',
      color: 'from-pink-500 to-purple-500', 
      image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      curator: 'Beats by Dre',
      curatorAvatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      trackCount: 16,
      featured: true,
      tags: ['R&B', 'Smooth', 'Vocal'],
      date: 'Updated 2 days ago'
    },
    { 
      id: 'trap', 
      title: 'Trap Kings', 
      description: 'Hard-hitting trap beats with massive 808s',
      color: 'from-yellow-500 to-amber-500', 
      image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      curator: 'KBeatz',
      curatorAvatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      trackCount: 20,
      featured: false,
      tags: ['Trap', 'Bass', 'Hard'],
      date: 'Updated 1 day ago'
    },
    { 
      id: 'amapiano', 
      title: 'Amapiano Waves', 
      description: 'Modern Amapiano beats with infectious grooves',
      color: 'from-indigo-500 to-blue-500', 
      image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      curator: 'Sound Vibe',
      curatorAvatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      trackCount: 15,
      featured: false,
      tags: ['Amapiano', 'Log Drum', 'Groove'],
      date: 'Updated 4 days ago'
    },
    { 
      id: 'drill', 
      title: 'Drill Essentials', 
      description: 'Raw and authentic drill beats from Nigeria',
      color: 'from-gray-800 to-gray-900', 
      image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      curator: 'JUNE',
      curatorAvatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      trackCount: 14,
      featured: false,
      tags: ['Drill', 'Street', 'Bass'],
      date: 'Updated 1 week ago'
    },
    { 
      id: 'lofi', 
      title: 'Lo-Fi & Chill', 
      description: 'Relaxing lo-fi beats for study and focus',
      color: 'from-cyan-500 to-blue-500', 
      image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      curator: 'KBeatz',
      curatorAvatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
      trackCount: 30,
      featured: false,
      tags: ['Lo-Fi', 'Chill', 'Study'],
      date: 'Updated 3 days ago'
    },
  ];
  
  // Filter to featured collections only
  const onlyFeaturedCollections = featuredCollections.filter(c => c.featured);
  
  // Mood-based categories
  const moodCategories = [
    { name: "Energetic", icon: <Sparkles size={16} />, color: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" },
    { name: "Chill", icon: <Clock size={16} />, color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
    { name: "Inspirational", icon: <Star size={16} />, color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400" },
    { name: "Reflective", icon: <Music size={16} />, color: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" },
    { name: "Party", icon: <Sparkles size={16} />, color: "bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400" },
    { name: "Focus", icon: <Clock size={16} />, color: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" },
  ];

  // If a collection ID is provided, show that specific collection
  if (collectionId) {
    const collection = featuredCollections.find(c => c.id === collectionId);
    
    if (!collection) {
      return (
        <MainLayoutWithPlayer>
          <div className="container py-8">
            <h1 className="text-2xl font-bold mb-4">Collection not found</h1>
            <p className="text-muted-foreground mb-4">The collection you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/collections">Back to collections</Link>
            </Button>
          </div>
        </MainLayoutWithPlayer>
      );
    }
    
    return (
      <MainLayoutWithPlayer>
        {/* Collection Header with gradient background */}
        <div className={`bg-gradient-to-br ${collection.color} h-[200px] md:h-[300px] relative overflow-hidden`}>
          <div className="absolute inset-0 bg-pattern-dots mix-blend-overlay opacity-20"></div>
          <div className="absolute inset-0 flex items-center">
            <div className="container">
              <div className="max-w-2xl">
                <Badge className="mb-3 bg-white/20 text-white backdrop-blur-sm">Collection</Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{collection.title}</h1>
                <p className="text-white/80 mb-4">{collection.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {collection.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-white/10 text-white border-white/20">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Button className="bg-white text-purple-600 hover:bg-white/90">
                    <Play size={16} className="mr-2" /> Play All
                  </Button>
                  <div className="flex items-center text-white/80 text-sm">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={collection.curatorAvatar} alt={collection.curator} />
                      <AvatarFallback>{collection.curator.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    Curated by {collection.curator}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Collection content */}
        <div className="container py-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Beats in this collection</h2>
              <Badge variant="outline" className="text-xs">
                {collection.trackCount} tracks
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={16} />
              <span>{collection.date}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {trendingBeats.slice(0, collection.trackCount).map((beat) => (
              <BeatCard key={beat.id} beat={beat} />
            ))}
          </div>
          
          <div className="mt-12">
            <h3 className="text-lg font-semibold mb-4">Similar Collections</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredCollections
                .filter(c => c.id !== collectionId)
                .slice(0, 4)
                .map((collection) => (
                  <Link key={collection.id} to={`/collections/${collection.id}`} className="block">
                    <div className={`aspect-square rounded-lg overflow-hidden bg-gradient-to-br ${collection.color} relative group`}>
                      <div className="absolute inset-0 opacity-20 bg-pattern-dots mix-blend-overlay"></div>
                      <div className="p-4 flex flex-col h-full justify-between">
                        <div className="flex justify-end">
                          <Badge variant="outline" className="bg-white/20 text-white border-white/10">
                            Collection
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{collection.title}</h3>
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">
                              <Play size={14} className="mr-1" /> Explore
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  // Collections Home Page
  return (
    <MainLayoutWithPlayer>
      <div className="min-h-screen">
        {/* Collections Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900">
          <div className="container py-12 md:py-20">
            <Badge className="mb-3 bg-white/20 text-white backdrop-blur-sm">Browse Collections</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Beat Collections</h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mb-6">
              Curated selections of the best beats, organized by genre, mood, and style for your next project.
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search collections..." className="pl-9 bg-white/10 text-white placeholder:text-white/60 border-white/20 focus-visible:ring-white/20" />
            </div>
          </div>
        </div>
        
        {/* Mood Categories */}
        <div className="container py-8">
          <h2 className="text-xl font-semibold mb-4">Browse by Mood</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {moodCategories.map((category, index) => (
              <Card key={index} className="border hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mb-3`}>
                    {category.icon}
                  </div>
                  <h3 className="font-medium">{category.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="container py-4">
          <Separator />
        </div>
        
        {/* Main Collections */}
        <div className="container py-4">
          <Tabs defaultValue="featured" onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="featured" className="gap-2">
                  <Star size={16} />
                  <span>Featured</span>
                </TabsTrigger>
                <TabsTrigger value="all" className="gap-2">
                  <Library size={16} />
                  <span>All Collections</span>
                </TabsTrigger>
                <TabsTrigger value="new" className="gap-2">
                  <Calendar size={16} />
                  <span>Recently Updated</span>
                </TabsTrigger>
              </TabsList>
              
              <Button variant="outline" size="sm" className="gap-2">
                <Filter size={14} />
                <span>Filter</span>
              </Button>
            </div>
            
            <TabsContent value="featured" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {onlyFeaturedCollections.map((collection) => (
                  <Card key={collection.id} className="overflow-hidden hover:shadow-md transition-all">
                    <div className={`h-40 bg-gradient-to-r ${collection.color} relative`}>
                      <div className="absolute inset-0 bg-pattern-dots mix-blend-overlay opacity-20"></div>
                      <div className="p-4 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <Badge className="bg-white/20 text-white border-white/10">
                            Collection
                          </Badge>
                          <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                            {collection.trackCount} tracks
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{collection.title}</h3>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={collection.curatorAvatar} alt={collection.curator} />
                            <AvatarFallback>{collection.curator.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">Curated by {collection.curator}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{collection.date}</div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{collection.description}</p>
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {collection.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" size="sm" className="gap-1" asChild>
                          <Link to={`/collections/${collection.id}`}>
                            <span>View Collection</span>
                            <ArrowRight size={14} />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Play size={14} />
                          <span>Play All</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredCollections.map((collection) => (
                  <Link key={collection.id} to={`/collections/${collection.id}`} className="block">
                    <div className={`aspect-square rounded-lg overflow-hidden bg-gradient-to-br ${collection.color} relative group`}>
                      <div className="absolute inset-0 opacity-20 bg-pattern-dots mix-blend-overlay"></div>
                      <div className="p-4 flex flex-col h-full justify-between">
                        <div className="flex justify-between">
                          <Badge variant="outline" className="bg-white/20 text-white border-white/10">
                            Collection
                          </Badge>
                          {collection.featured && (
                            <Badge className="bg-yellow-500/80 text-white">
                              <Star size={12} className="mr-1" /> Featured
                            </Badge>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={collection.curatorAvatar} alt={collection.curator} />
                              <AvatarFallback>{collection.curator.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-white/80">by {collection.curator}</span>
                          </div>
                          <h3 className="text-xl font-bold text-white">{collection.title}</h3>
                          <p className="text-sm text-white/70 mb-2 line-clamp-2">{collection.description}</p>
                          <div className="flex gap-1 flex-wrap mb-2">
                            {collection.tags.slice(0, 2).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-white/10 text-white border-white/20">
                                {tag}
                              </Badge>
                            ))}
                            {collection.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20">
                                +{collection.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">
                              <Play size={14} className="mr-1" /> Explore
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="new" className="mt-6">
              <div className="space-y-4">
                {featuredCollections
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((collection) => (
                    <Card key={collection.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className={`w-full md:w-36 h-36 bg-gradient-to-r ${collection.color} relative flex-shrink-0`}>
                          <div className="absolute inset-0 bg-pattern-dots mix-blend-overlay opacity-20"></div>
                          <div className="p-4 h-full flex flex-col justify-between">
                            <Badge className="inline-block w-fit bg-white/20 text-white border-white/10">
                              Collection
                            </Badge>
                            <h3 className="text-xl font-bold text-white">{collection.title}</h3>
                          </div>
                        </div>
                        <CardContent className="p-4 flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={collection.curatorAvatar} alt={collection.curator} />
                                <AvatarFallback>{collection.curator.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">Curated by {collection.curator}</span>
                            </div>
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/30">
                              {collection.date}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{collection.description}</p>
                          <div className="flex justify-between items-center">
                            <div className="flex gap-2 flex-wrap">
                              {collection.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  <Tag size={10} className="mr-1" /> {tag}
                                </Badge>
                              ))}
                            </div>
                            <Button variant="outline" size="sm" className="gap-1 flex-shrink-0" asChild>
                              <Link to={`/collections/${collection.id}`}>
                                <span>View</span>
                                <ChevronRight size={14} />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
}
