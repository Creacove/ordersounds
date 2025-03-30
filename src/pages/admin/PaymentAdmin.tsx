import React, { useEffect, useState } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { usePaystackAdmin } from '@/hooks/payment/usePaystackAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProducerBankDetailsForm } from '@/components/payment/ProducerBankDetailsForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PaymentAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeProducerId, setActiveProducerId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'bank' | 'percentage'>('bank');
  const [newPercentage, setNewPercentage] = useState<number>(90);
  
  const {
    subaccounts,
    splits,
    transactions,
    producers,
    isLoading,
    isUpdating,
    fetchSubaccounts,
    fetchSplits,
    fetchProducers,
    fetchTransactions,
    updateProducerBankInfo,
    updateProducerShare,
    retryFailedTransaction
  } = usePaystackAdmin();
  
  // Load data on component mount
  useEffect(() => {
    // Set page title
    document.title = "Payment Administration | OrderSOUNDS";
    
    // Verify admin role
    if (user && user.role !== 'admin') {
      toast.error('Access denied: Admin privileges required.');
      navigate('/');
      return;
    }
    
    fetchProducers();
  }, [user, navigate, fetchProducers]);
  
  const loadTabData = (tab: string) => {
    switch (tab) {
      case 'subaccounts':
        fetchSubaccounts();
        break;
      case 'splits':
        fetchSplits();
        break;
      case 'transactions':
        fetchTransactions();
        break;
      default:
        break;
    }
  };
  
  const handleRetryTransaction = async (transactionId: string) => {
    const success = await retryFailedTransaction(transactionId);
    if (success) {
      toast.success('Transaction retry initiated successfully.');
    } else {
      toast.error('Failed to retry transaction. Please try again.');
    }
  };
  
  const handleUpdateSplitPercentage = async () => {
    if (!activeProducerId) return;
    
    if (newPercentage < 1 || newPercentage > 99) {
      toast.error('Percentage must be between 1 and 99.');
      return;
    }
    
    const success = await updateProducerShare(activeProducerId, newPercentage);
    
    if (success) {
      toast.success('Producer share percentage updated successfully.');
      setIsEditDialogOpen(false);
      
      // Refresh data
      fetchSplits();
      fetchProducers();
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'settled':
      case 'completed':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'pending':
      case 'processing':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
      case 'error':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };
  
  // Find producer by ID
  const getProducerById = (id: string) => {
    return producers.find(p => p.id === id);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };
  
  if (!user) {
    return (
      <MainLayout>
        <div className="container py-8">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Please sign in to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Payment Administration</h1>
        
        <Tabs defaultValue="producers" onValueChange={loadTabData}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="producers">Producers</TabsTrigger>
            <TabsTrigger value="subaccounts">Subaccounts</TabsTrigger>
            <TabsTrigger value="splits">Payment Splits</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          
          {/* Producers Tab */}
          <TabsContent value="producers">
            <Card>
              <CardHeader>
                <CardTitle>Producer Accounts</CardTitle>
                <CardDescription>
                  Manage producer bank details and payment information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : producers.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                    <h3 className="text-lg font-medium">No producers found</h3>
                    <p className="text-muted-foreground">
                      No registered producers with bank details.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex justify-end mb-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => fetchProducers()}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw size={16} />
                        Refresh
                      </Button>
                    </div>
                  
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producer</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Bank Details</TableHead>
                          <TableHead>Paystack Integration</TableHead>
                          <TableHead>Split Share</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {producers.map((producer) => (
                          <TableRow key={producer.id}>
                            <TableCell className="font-medium">
                              {producer.producer_name || producer.full_name}
                            </TableCell>
                            <TableCell>{producer.email}</TableCell>
                            <TableCell>
                              {producer.bank_code && producer.account_number ? (
                                <div>
                                  <div className="text-sm font-medium">
                                    {producer.verified_account_name || 'Account Verified'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Account: ****{producer.account_number.slice(-4)}
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
                                  No bank details
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {producer.paystack_subaccount_code ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="text-green-500 h-4 w-4" />
                                  <span className="text-sm">Integrated</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="text-amber-500 h-4 w-4" />
                                  <span className="text-sm">Not integrated</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {producer.paystack_split_code ? '90%' : 'Not set'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setActiveProducerId(producer.id);
                                    setEditMode('bank');
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  Edit Bank
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setActiveProducerId(producer.id);
                                    setEditMode('percentage');
                                    setNewPercentage(90);
                                    setIsEditDialogOpen(true);
                                  }}
                                  disabled={!producer.paystack_split_code}
                                >
                                  Edit Split
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Subaccounts Tab */}
          <TabsContent value="subaccounts">
            <Card>
              <CardHeader>
                <CardTitle>Paystack Subaccounts</CardTitle>
                <CardDescription>
                  View all subaccounts created in Paystack for producers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : subaccounts?.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-end mb-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => fetchSubaccounts()}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw size={16} />
                        Refresh
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Business Name</TableHead>
                          <TableHead>Subaccount Code</TableHead>
                          <TableHead>Bank</TableHead>
                          <TableHead>Account Number</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subaccounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.business_name}</TableCell>
                            <TableCell>{account.subaccount_code}</TableCell>
                            <TableCell>{account.settlement_bank}</TableCell>
                            <TableCell>****{account.account_number.slice(-4)}</TableCell>
                            <TableCell>{getStatusBadge(account.active ? 'active' : 'inactive')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                    <h3 className="text-lg font-medium">No subaccounts found</h3>
                    <p className="text-muted-foreground mb-4">
                      No Paystack subaccounts have been created yet.
                    </p>
                    <Button onClick={() => fetchSubaccounts()}>
                      <RefreshCw size={16} className="mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Splits Tab */}
          <TabsContent value="splits">
            <Card>
              <CardHeader>
                <CardTitle>Payment Splits</CardTitle>
                <CardDescription>
                  View and manage transaction split configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : splits?.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-end mb-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => fetchSplits()}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw size={16} />
                        Refresh
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Split Name</TableHead>
                          <TableHead>Split Code</TableHead>
                          <TableHead>Split Type</TableHead>
                          <TableHead>Main Account</TableHead>
                          <TableHead>Subaccounts</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {splits.map((split) => (
                          <TableRow key={split.id}>
                            <TableCell className="font-medium">{split.name}</TableCell>
                            <TableCell>{split.split_code}</TableCell>
                            <TableCell>{split.split_type}</TableCell>
                            <TableCell>{100 - (split.subaccounts?.[0]?.share || 0)}%</TableCell>
                            <TableCell>
                              {split.subaccounts?.map((sub: any, index: number) => (
                                <div key={index} className="text-sm">
                                  {sub.subaccount.slice(0, 8)}...:{' '}
                                  <span className="font-medium">{sub.share}%</span>
                                </div>
                              ))}
                            </TableCell>
                            <TableCell>{getStatusBadge(split.active ? 'active' : 'inactive')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                    <h3 className="text-lg font-medium">No splits found</h3>
                    <p className="text-muted-foreground mb-4">
                      No payment splits have been created yet.
                    </p>
                    <Button onClick={() => fetchSplits()}>
                      <RefreshCw size={16} className="mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>
                  View transaction history with payment splits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : transactions?.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-end mb-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => fetchTransactions()}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw size={16} />
                        Refresh
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Beat</TableHead>
                          <TableHead>Producer</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Platform Share</TableHead>
                          <TableHead>Producer Share</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="font-medium">{tx.reference}</TableCell>
                            <TableCell>{tx.beat}</TableCell>
                            <TableCell>{tx.producer}</TableCell>
                            <TableCell>{formatCurrency(tx.amount)}</TableCell>
                            <TableCell>{formatCurrency(tx.platform_share)}</TableCell>
                            <TableCell>{formatCurrency(tx.producer_share)}</TableCell>
                            <TableCell>{getStatusBadge(tx.status)}</TableCell>
                            <TableCell>
                              {tx.status === 'failed' && (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleRetryTransaction(tx.id)}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Retry'}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                    <h3 className="text-lg font-medium">No transactions found</h3>
                    <p className="text-muted-foreground mb-4">
                      No payment transactions have been recorded yet.
                    </p>
                    <Button onClick={() => fetchTransactions()}>
                      <RefreshCw size={16} className="mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editMode === 'bank' ? 'Edit Bank Details' : 'Edit Split Percentage'}
              </DialogTitle>
              <DialogDescription>
                {editMode === 'bank' 
                  ? 'Update the producer\'s bank account information'
                  : 'Update the producer\'s share percentage from sales'}
              </DialogDescription>
            </DialogHeader>
            
            {editMode === 'bank' && activeProducerId && (
              <div className="py-4">
                <ProducerBankDetailsForm 
                  producerId={activeProducerId}
                  existingBankCode={getProducerById(activeProducerId)?.bank_code}
                  existingAccountNumber={getProducerById(activeProducerId)?.account_number}
                  existingAccountName={getProducerById(activeProducerId)?.verified_account_name}
                  onSuccess={() => {
                    setIsEditDialogOpen(false);
                    fetchProducers();
                  }}
                />
              </div>
            )}
            
            {editMode === 'percentage' && (
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="percentage">Producer Share Percentage</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="percentage"
                      type="number"
                      min="1"
                      max="99"
                      value={newPercentage}
                      onChange={(e) => setNewPercentage(parseInt(e.target.value))}
                    />
                    <span>%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Platform share will be {100 - newPercentage}%
                  </p>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateSplitPercentage}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
