import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { BeatCard } from "@/components/ui/BeatCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Play, Pause, ExternalLink, UserPlus, Share2, Mail, MapPin, 
  Calendar, Star, BarChart, Music, Heart, ShoppingCart, 
  Headphones, Instagram, Twitter, Globe, Facebook, Youtube, 
  ChevronLeft, ChevronRight, ArrowLeft
} from "lucide-react";
import { useBeats } from "@/hooks/useBeats";
import { usePlayer } from "@/context/PlayerContext";

const ProducerProfile = () => {
  const { producerId } = useParams();
  const { trendingBeats, newBeats, isLoading } = useBeats();
  const { playBeat } = usePlayer();
  const [currentPage, setCurrentPage] = useState(1);
  const beatsPerPage = 8;

  const producer = {
    id: producerId,
    name: "JUNE",
    fullName: "June Akesson",
    username: "producerjune",
    bio: "Award-winning producer specializing in Afrobeat and Amapiano fusion. I've worked with top artists across Nigeria and beyond. Known for my unique blend of traditional sounds with modern production techniques.",
    location: "Lagos, Nigeria",
    joinDate: "January 2020",
    verified: true,
    avatar: "/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png",
    coverImage: "/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png",
    stats: {
      followers: 12564,
      beats: 68,
      sales: 432,
      rating: 4.8
    },
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/producerjune" },
      { platform: "twitter", url: "https://twitter.com/producerjune" },
      { platform: "youtube", url: "https://youtube.com/producerjune" },
      { platform: "website", url: "https://producerjune.com" }
    ],
    genres: ["Afrobeat", "Amapiano", "Hip Hop", "R&B"],
    profileImageUrl: "/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png"
  };

  const producerBeats = trendingBeats.map((beat, index) => ({
    ...beat,
    producer_name: producer.name,
    plays: 1200 - (index * 50),
    downloads: 85 - (index * 5),
    releaseDate: "2023-11-15"
  }));

  const indexOfLastBeat = currentPage * beatsPerPage;
  const indexOfFirstBeat = indexOfLastBeat - beatsPerPage;
  const currentBeats = producerBeats.slice(indexOfFirstBeat, indexOfLastBeat);
  const totalPages = Math.ceil(producerBeats.length / beatsPerPage);
  
  const popularBeats = producerBeats.slice(0, 5).sort((a, b) => b.plays - a.plays);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getSocialIcon = (platform) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      case "website":
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const handlePlayBeat = (beat) => {
    playBeat(beat);
  };

  const reviews = [
    {
      id: 1,
      user: {
        name: "Alex Johnson",
        avatar: "/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png",
      },
      rating: 5,
      date: "2023-10-15",
      text: "Absolutely amazing producer to work with. The beats are top quality and the communication was perfect throughout the process."
    },
    {
      id: 2,
      user: {
        name: "Michelle K.",
        avatar: "/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png",
      },
      rating: 4,
      date: "2023-09-22",
      text: "Great quality beats with excellent mixing. Would definitely recommend and buy from again."
    },
    {
      id: 3,
      user: {
        name: "David Wilson",
        avatar: "/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png",
      },
      rating: 5,
      date: "2023-08-30",
      text: "One of the best producers I've worked with. The beats are unique and the quality is outstanding."
    }
  ];

  return (
    <MainLayoutWithPlayer>
      <div className="relative">
        <div className="absolute top-0 inset-x-0 h-[20vh] bg-gradient-to-b from-primary/20 to-background -z-10" />
        
        <div className="container max-w-4xl py-4 md:py-6 px-4">
          <div className="flex items-center space-x-2 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              as={Link}
              to="/producers"
              className="h-8 w-8 rounded-full"
            >
              <ArrowLeft size={16} />
            </Button>
            <div className="flex text-xs">
              <Link to="/producers" className="text-muted-foreground hover:text-foreground">
                Producers
              </Link>
              <span className="mx-1 text-muted-foreground">•</span>
              <Link to={`/producer/${producerId}`} className="text-muted-foreground hover:text-foreground">
                {producer.name}
              </Link>
            </div>
          </div>
          
          <div className="rounded-xl bg-card/50 backdrop-blur-sm border shadow-sm overflow-hidden mb-4">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start gap-3 mb-2">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden flex-shrink-0 border shadow-sm">
                  <img 
                    src={producer.profileImageUrl} 
                    alt={producer.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold truncate">{producer.name}</h1>
                    {producer.verified && (
                      <Badge variant="outline" className="bg-primary/20 text-primary-foreground border-primary/10">
                        Verified Producer
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{producer.bio}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={12} /> {producer.location}
                    </span>
                    <span className="text-xs text-muted-foreground mx-1">•</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Music size={12} /> {producer.genres.join(', ')}
                    </span>
                    <span className="text-xs text-muted-foreground mx-1">•</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} /> Joined {producer.joinDate}
                    </span>
                    <span className="text-xs text-muted-foreground mx-1">•</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star size={12} className="text-yellow-400" /> {producer.stats.rating}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 my-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Music size={12} className="text-primary/70" /> {producer.stats.beats} beats
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <UserPlus size={12} className="text-primary/70" /> {producer.stats.followers.toLocaleString()} followers
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShoppingCart size={12} className="text-primary/70" /> {producer.stats.sales} sales
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <Button className="flex-none sm:flex-none rounded-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Follow
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Mail size={18} />
                </Button>
                
                <Button 
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Share2 size={18} />
                </Button>
                
                <div className="flex items-center gap-1 ml-auto">
                  {producer.socialLinks && producer.socialLinks.map((link, index) => (
                    <a 
                      key={index} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-2 rounded-full transition-colors h-8 w-8 flex items-center justify-center"
                      aria-label={`${link.platform} profile`}
                    >
                      {getSocialIcon(link.platform)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="beats" className="w-full">
            <TabsList className="mb-8 w-full justify-start overflow-x-auto">
              <TabsTrigger value="beats" className="text-base">Beats</TabsTrigger>
              <TabsTrigger value="popular" className="text-base">Popular</TabsTrigger>
              <TabsTrigger value="about" className="text-base">About</TabsTrigger>
              <TabsTrigger value="reviews" className="text-base">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="beats" className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">All Beats ({producerBeats.length})</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <select className="bg-background border rounded-md px-2 py-1 text-sm">
                    <option>Newest</option>
                    <option>Most Popular</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {isLoading ? (
                  Array(8).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse bg-card rounded-lg aspect-square" />
                  ))
                ) : (
                  currentBeats.map((beat) => (
                    <BeatCard key={beat.id} beat={beat} />
                  ))
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    size="icon"
                    disabled={currentPage === 1}
                    onClick={() => paginate(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button 
                      key={i} 
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => paginate(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button 
                    variant="outline" 
                    size="icon"
                    disabled={currentPage === totalPages}
                    onClick={() => paginate(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="popular" className="space-y-8">
              <h2 className="text-2xl font-bold">Most Popular Beats</h2>
              
              <div className="bg-card rounded-lg overflow-hidden border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Genre</TableHead>
                      <TableHead className="hidden md:table-cell">BPM</TableHead>
                      <TableHead className="hidden md:table-cell">Key</TableHead>
                      <TableHead>Plays</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popularBeats.map((beat, index) => (
                      <TableRow key={beat.id}>
                        <TableCell className="font-medium p-2">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                              <img 
                                src={beat.cover_image_url} 
                                alt={beat.title} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="font-medium truncate max-w-[140px] md:max-w-none">{beat.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{beat.genre}</TableCell>
                        <TableCell className="hidden md:table-cell">{beat.bpm} BPM</TableCell>
                        <TableCell className="hidden md:table-cell">{beat.key || 'N/A'}</TableCell>
                        <TableCell>{beat.plays.toLocaleString()}</TableCell>
                        <TableCell>₦{beat.price_local}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handlePlayBeat(beat)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="about" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>About {producer.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Bio</h3>
                    <p className="text-muted-foreground">{producer.bio}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {producer.genres.map((genre, index) => (
                        <Badge key={index} variant="secondary">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <div className="flex justify-center mb-2">
                          <Headphones className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-xl font-bold">{producer.stats.beats}</div>
                        <div className="text-xs text-muted-foreground">Total Beats</div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <div className="flex justify-center mb-2">
                          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-xl font-bold">{producer.stats.sales}</div>
                        <div className="text-xs text-muted-foreground">Total Sales</div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <div className="flex justify-center mb-2">
                          <UserPlus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-xl font-bold">{producer.stats.followers.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Followers</div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <div className="flex justify-center mb-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="text-xl font-bold">{producer.stats.rating}</div>
                        <div className="text-xs text-muted-foreground">Rating</div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">Contact</h3>
                    <div className="flex flex-wrap gap-4">
                      <Button variant="outline" className="gap-2">
                        <Mail className="h-4 w-4" />
                        <span>Send Message</span>
                      </Button>
                      {producer.socialLinks && producer.socialLinks.map((link, index) => (
                        <Button key={index} variant="outline" className="gap-2" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {getSocialIcon(link.platform)}
                            <span>{link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}</span>
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Customer Reviews</h2>
                <Badge variant="outline" className="gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{producer.stats.rating} ({reviews.length} reviews)</span>
                </Badge>
              </div>
              
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.user.avatar} alt={review.user.name} />
                          <AvatarFallback>{review.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                            <div>
                              <h3 className="font-semibold">{review.user.name}</h3>
                              <div className="text-sm text-muted-foreground">{review.date}</div>
                            </div>
                            <div className="flex">
                              {Array(5).fill(0).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground">{review.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="text-center">
                <Button variant="outline">Load More Reviews</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
};

export default ProducerProfile;
