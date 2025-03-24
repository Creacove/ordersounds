
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, BarChart3, Calendar, Music } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { getProducerRoyaltySplits } from "@/lib/beatStorage";
import { RoyaltySplit } from "@/types";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function Royalties() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [royaltySplits, setRoyaltySplits] = useState<RoyaltySplit[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    document.title = "Royalty Splits | Creacove";
    
    // Redirect to login if not authenticated or not a producer
    if (!user) {
      navigate('/login', { state: { from: '/producer/royalties' } });
    } else if (user.role !== 'producer') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchRoyaltySplits = async () => {
      if (user && user.id) {
        setLoading(true);
        try {
          const splits = await getProducerRoyaltySplits(user.id);
          setRoyaltySplits(splits);
        } catch (error) {
          console.error("Error fetching royalty splits:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchRoyaltySplits();
  }, [user]);

  // Group splits by beat
  const beatSplits = royaltySplits.reduce((acc, split) => {
    if (!acc[split.beat_id]) {
      acc[split.beat_id] = {
        beatId: split.beat_id,
        beatTitle: split.beat_title,
        beatCoverImage: split.beat_cover_image,
        splits: []
      };
    }
    acc[split.beat_id].splits.push(split);
    return acc;
  }, {} as Record<string, { beatId: string; beatTitle: string; beatCoverImage: string | null; splits: RoyaltySplit[] }>);

  const groupedSplits = Object.values(beatSplits);

  // Generate random earnings data for the stats cards
  // In a real app, this would come from your backend
  const totalEarnings = 1250.75;
  const monthlyEarnings = 320.50;
  const salesCount = 15;
  const growthPercentage = 12;

  // If not logged in or not a producer, show login prompt
  if (!user || user.role !== 'producer') {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Producer Access Required</h1>
            <p className="mb-4">You need to be logged in as a producer to access this page.</p>
            <Button onClick={() => navigate('/login')}>Login</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Royalty Splits & Earnings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime earnings from your beats
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlyEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesCount}</div>
              <p className="text-xs text-muted-foreground">
                Total beats purchased
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{growthPercentage}%</div>
              <p className="text-xs text-muted-foreground">
                Year over year growth
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Royalty Splits</CardTitle>
            <CardDescription>Manage splits with collaborators on your beats</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-6">
                {[1, 2].map((index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-24 w-full" />
                  </div>
                ))}
              </div>
            ) : groupedSplits.length > 0 ? (
              <div className="space-y-8">
                {groupedSplits.map((beatGroup) => (
                  <div key={beatGroup.beatId} className="border rounded-lg p-4">
                    <div className="flex items-center gap-4 mb-4">
                      {beatGroup.beatCoverImage ? (
                        <img 
                          src={beatGroup.beatCoverImage} 
                          alt={beatGroup.beatTitle}
                          className="h-16 w-16 object-cover rounded-md" 
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                          <Music className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{beatGroup.beatTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                          {beatGroup.splits.length} collaborator{beatGroup.splits.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {beatGroup.splits.map((split) => (
                        <div key={split.id} className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border">
                            <div className="flex items-center justify-center h-full w-full bg-primary/10 text-primary font-medium">
                              {split.collaborator_name.substring(0, 2).toUpperCase()}
                            </div>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <div>
                                <span className="font-medium">{split.collaborator_name}</span>
                                <span className="text-sm text-muted-foreground ml-2">({split.collaborator_role})</span>
                              </div>
                              <span className="font-bold">{split.percentage}%</span>
                            </div>
                            <Progress value={split.percentage} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">You don't have any royalty splits set up yet</p>
                <Button variant="outline" onClick={() => navigate('/producer/beats')}>
                  Set Up Splits
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
