
import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePaystackAdmin } from '@/hooks/payment/usePaystackAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Loader2, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  CreditCard, 
  Users, 
  SplitSquareVertical, 
  ArrowRightLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCcw
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PaymentAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('producers');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'bank' | 'split'>('bank');
  const [selectedProducer, setSelectedProducer] = useState<any>(null);
  const [newBankCode, setNewBankCode] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newSplitPercentage, setNewSplitPercentage] = useState(90);
  const [maskAccountNumbers, setMaskAccountNumbers] = useState(true);
  
  const {
    producers,
    subaccounts,
    splits,
    transactions,
    isLoading,
    isUpdating,
    fetchProducers,
    fetchSubaccounts,
    fetchSplits,
    fetchTransactions,
    updateProducerBankInfo,
    updateProducerShare,
    retryFailedTransaction
  } = usePaystackAdmin();
  
  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // In a real app, you would check if the user has admin role
    // For now, we'll assume the check is done elsewhere
  }, [user, navigate]);
  
  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchProducers();
    }
  }, [user, fetchProducers]);
  
  // Load tab-specific data when tab changes
  useEffect(() => {
    if (!user) return;
    
    switch (activeTab) {
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
  }, [activeTab, user, fetchSubaccounts, fetchSplits, fetchTransactions]);
  
  const handleEditBankDetails = (producer: any) => {
    setSelectedProducer(producer);
    setNewBankCode(producer.bank_code || '');
    setNewAccountNumber(producer.account_number || '');
    setEditMode('bank');
    setIsEditDialogOpen(true);
  };
  
  const handleEditSplitPercentage = (producer: any) => {
    setSelectedProducer(producer);
    setNewSplitPercentage(90); // Default to 90%
    setEditMode('split');
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateBankDetails = async () => {
    if (!selectedProducer || !newBankCode || !newAccountNumber) {
      toast.error('Bank details are incomplete');
      return;
    }
    
    const success = await updateProducerBankInfo(
      selectedProducer.id,
      newBankCode,
      newAccountNumber
    );
    
    if (success) {
      setIsEditDialogOpen(false);
      toast.success('Bank details updated successfully');
    }
  };
  
  const handleUpdateSplitPercentage = async () => {
    if (!selectedProducer || newSplitPercentage < 1 || newSplitPercentage > 99) {
      toast.error('Split percentage must be between 1% and 99%');
      return;
    }
    
    const success = await updateProducerShare(
      selectedProducer.id,
      newSplitPercentage
    );
    
    if (success) {
      setIsEditDialogOpen(false);
      toast.success('Split percentage updated successfully');
    }
  };
  
  const handleRetryTransaction = async (transactionId: string) => {
    const success = await retryFailedTransaction(transactionId);
    
    if (success) {
      toast.success('Transaction retry initiated');
    } else {
      toast.error('Failed to retry transaction');
    }
  };
  
  // Format account number for display (mask or show full)
  const formatAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return 'Not set';
    if (maskAccountNumbers) {
      const length = accountNumber.length;
      const lastFour = accountNumber.slice(-4);
      const masked = '*'.repeat(Math.max(0, length - 4));
      return masked + lastFour;
    }
    return accountNumber;
  };
  
  // Function to get transaction status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return (
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 text-xs font-medium">Success</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-red-600 text-xs font-medium">Failed</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
            <span className="text-amber-600 text-xs font-medium">Pending</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-gray-600 text-xs font-medium">{status}</span>
          </div>
        );
    }
  };
  
  if (!user) {
    return (
      <MainLayout>
        <div className="container py-8">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Payment Admin</h1>
            <p className="text-muted-foreground">
              Manage transaction splits, subaccounts, and payment history
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                switch (activeTab) {
                  case 'producers':
                    fetchProducers();
                    break;
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
                toast.success(`${activeTab} data refreshed`);
              }}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Refresh</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMaskAccountNumbers(!maskAccountNumbers)}
              className="flex items-center gap-1"
            >
              {maskAccountNumbers ? (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Show Account Numbers</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Mask Account Numbers</span>
                </>
              )}
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="producers" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="producers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Producers</span>
            </TabsTrigger>
            <TabsTrigger value="subaccounts" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Subaccounts</span>
            </TabsTrigger>
            <TabsTrigger value="splits" className="flex items-center gap-2">
              <SplitSquareVertical className="h-4 w-4" />
              <span className="hidden sm:inline">Splits</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="producers">
            <Card>
              <CardHeader>
                <CardTitle>Producer Accounts</CardTitle>
                <CardDescription>
                  Manage producer bank details and payment splits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : producers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No producers found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producer</TableHead>
                          <TableHead>Bank Details</TableHead>
                          <TableHead>Subaccount Code</TableHead>
                          <TableHead>Split Code</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {producers.map((producer) => (
                          <TableRow key={producer.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{producer.producer_name || producer.full_name}</p>
                                <p className="text-xs text-muted-foreground">{producer.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {producer.bank_code && producer.account_number ? (
                                <div>
                                  <p className="text-sm">{producer.verified_account_name || 'Account Holder'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatAccountNumber(producer.account_number)}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Not set</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {producer.paystack_subaccount_code ? (
                                <code className="text-xs bg-muted p-1 rounded">
                                  {producer.paystack_subaccount_code}
                                </code>
                              ) : (
                                <span className="text-sm text-muted-foreground">Not created</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {producer.paystack_split_code ? (
                                <code className="text-xs bg-muted p-1 rounded">
                                  {producer.paystack_split_code}
                                </code>
                              ) : (
                                <span className="text-sm text-muted-foreground">Not created</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditBankDetails(producer)}
                                >
                                  Edit Bank
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditSplitPercentage(producer)}
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
          
          <TabsContent value="subaccounts">
            <Card>
              <CardHeader>
                <CardTitle>Paystack Subaccounts</CardTitle>
                <CardDescription>
                  View all subaccounts created in Paystack
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : subaccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No subaccounts found</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={fetchSubaccounts}
                    >
                      Fetch Subaccounts
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Business Name</TableHead>
                          <TableHead>Subaccount Code</TableHead>
                          <TableHead>Account Details</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subaccounts.map((subaccount) => (
                          <TableRow key={subaccount.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{subaccount.business_name}</p>
                                <p className="text-xs text-muted-foreground">{subaccount.description}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted p-1 rounded">
                                {subaccount.subaccount_code}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{subaccount.account_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {subaccount.settlement_bank} - {formatAccountNumber(subaccount.account_number)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(subaccount.active ? 'success' : 'failed')}
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
          
          <TabsContent value="splits">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Splits</CardTitle>
                <CardDescription>
                  View all transaction splits configured in Paystack
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : splits.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No transaction splits found</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={fetchSplits}
                    >
                      Fetch Splits
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Split Name</TableHead>
                          <TableHead>Split Code</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Subaccounts</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {splits.map((split) => (
                          <TableRow key={split.id}>
                            <TableCell>
                              <p className="font-medium">{split.name}</p>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted p-1 rounded">
                                {split.split_code}
                              </code>
                            </TableCell>
                            <TableCell>
                              <span className="capitalize">{split.type}</span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">Platform: {split.bearer_type === 'account' ? 'Bears fees' : 'No fees'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {split.subaccounts.length} subaccount(s)
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(split.active ? 'success' : 'failed')}
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
          
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  View and manage payment transactions with splits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No transactions found</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={fetchTransactions}
                    >
                      Fetch Transactions
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Split</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{transaction.beat}</p>
                                <p className="text-xs text-muted-foreground">
                                  <code>{transaction.reference}</code>
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{transaction.producer}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(transaction.date).toLocaleDateString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">₦{transaction.amount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                  Fee: ₦{transaction.paystack_fees.toLocaleString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-xs">Platform: ₦{transaction.platform_share.toLocaleString()}</p>
                                <p className="text-xs">Producer: ₦{transaction.producer_share.toLocaleString()}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(transaction.status)}
                            </TableCell>
                            <TableCell>
                              {transaction.status === 'failed' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleRetryTransaction(transaction.id)}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCcw className="h-3 w-3" />
                                  )}
                                  <span>Retry</span>
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled
                                >
                                  View
                                </Button>
                              )}
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
        </Tabs>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editMode === 'bank' ? 'Edit Bank Details' : 'Edit Split Percentage'}
            </DialogTitle>
            <DialogDescription>
              {editMode === 'bank' 
                ? 'Update the bank account information for this producer.'
                : 'Update the split percentage for this producer (default: 90%).'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedProducer && (
            <div className="py-4">
              <h3 className="font-medium mb-2">
                {selectedProducer.producer_name || selectedProducer.full_name}
              </h3>
              
              {editMode === 'bank' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="bank_code" className="text-sm font-medium">
                      Bank Name
                    </label>
                    <Select value={newBankCode} onValueChange={setNewBankCode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="044">Access Bank</SelectItem>
                        <SelectItem value="063">Access Bank (Diamond)</SelectItem>
                        <SelectItem value="050">Ecobank Nigeria</SelectItem>
                        <SelectItem value="070">Fidelity Bank</SelectItem>
                        <SelectItem value="011">First Bank of Nigeria</SelectItem>
                        <SelectItem value="214">First City Monument Bank</SelectItem>
                        <SelectItem value="058">Guaranty Trust Bank</SelectItem>
                        <SelectItem value="030">Heritage Bank</SelectItem>
                        <SelectItem value="301">Jaiz Bank</SelectItem>
                        <SelectItem value="082">Keystone Bank</SelectItem>
                        <SelectItem value="526">Parallex Bank</SelectItem>
                        <SelectItem value="076">Polaris Bank</SelectItem>
                        <SelectItem value="101">Providus Bank</SelectItem>
                        <SelectItem value="221">Stanbic IBTC Bank</SelectItem>
                        <SelectItem value="068">Standard Chartered Bank</SelectItem>
                        <SelectItem value="232">Sterling Bank</SelectItem>
                        <SelectItem value="100">Suntrust Bank</SelectItem>
                        <SelectItem value="102">Titan Bank</SelectItem>
                        <SelectItem value="032">Union Bank of Nigeria</SelectItem>
                        <SelectItem value="033">United Bank For Africa</SelectItem>
                        <SelectItem value="215">Unity Bank</SelectItem>
                        <SelectItem value="035">Wema Bank</SelectItem>
                        <SelectItem value="057">Zenith Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="account_number" className="text-sm font-medium">
                      Account Number
                    </label>
                    <Input
                      id="account_number"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      placeholder="Enter 10-digit account number"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="split_percentage" className="text-sm font-medium">
                      Producer Share (%)
                    </label>
                    <Input
                      id="split_percentage"
                      type="number"
                      min="1"
                      max="99"
                      value={newSplitPercentage}
                      onChange={(e) => setNewSplitPercentage(parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <div>
                      <p>Platform Share:</p>
                      <p className="font-semibold">{100 - newSplitPercentage}%</p>
                    </div>
                    <div>
                      <p>Producer Share:</p>
                      <p className="font-semibold">{newSplitPercentage}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={editMode === 'bank' ? handleUpdateBankDetails : handleUpdateSplitPercentage}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
