
import React, { useEffect, useState } from 'react';
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, AlertTriangle, CheckCircle, Loader2, RefreshCw, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

// Pagination Controls Component
interface PaginationControlsProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  isLoading = false
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  
  if (totalCount === 0) return null;
  
  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };
  
  const generatePageNumbers = () => {
    const pages = [];
    const showPages = 5; // Show 5 page numbers max
    
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalCount} items
      </div>
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage <= 1 || isLoading}
              className="gap-1 pl-2.5"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          </PaginationItem>
          
          {generatePageNumbers().map((pageNum) => (
            <PaginationItem key={pageNum}>
              <Button
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                className="w-10 h-10"
              >
                {pageNum}
              </Button>
            </PaginationItem>
          ))}
          
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage >= totalPages || isLoading}
              className="gap-1 pr-2.5"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default function PaymentAdmin() {
  const [activeProducerId, setActiveProducerId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'bank' | 'percentage'>('bank');
  const [newPercentage, setNewPercentage] = useState<number>(90);
  const [activeTab, setActiveTab] = useState('producers');
  
  const {
    subaccounts,
    splits,
    transactions,
    producers,
    isLoading,
    isUpdating,
    producersPagination,
    transactionsPagination,
    fetchSubaccounts,
    fetchSplits,
    fetchProducers,
    fetchTransactions,
    updateProducerBankInfo,
    updateProducerShare,
    retryFailedTransaction,
    handleProducersPageChange,
    handleTransactionsPageChange
  } = usePaystackAdmin();
  
  // Load producers data on component mount
  useEffect(() => {
    fetchProducers();
  }, [fetchProducers]);
  
  // Smart tab loading - only load data when tab is clicked
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Lazy load data for other tabs
    switch (tab) {
      case 'subaccounts':
        if (!subaccounts || subaccounts.length === 0) {
          fetchSubaccounts();
        }
        break;
      case 'splits':
        if (!splits || splits.length === 0) {
          fetchSplits();
        }
        break;
      case 'transactions':
        if (!transactions || transactions.length === 0) {
          fetchTransactions();
        }
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
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };
  
  const LoadingSkeleton = ({ rows = 5 }) => (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Management
        </CardTitle>
        <CardDescription>
          Manage producer payments, bank details, and transaction monitoring
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
            <TabsTrigger value="producers" className="text-xs md:text-sm">Producers</TabsTrigger>
            <TabsTrigger value="subaccounts" className="text-xs md:text-sm">Subaccounts</TabsTrigger>
            <TabsTrigger value="splits" className="text-xs md:text-sm">Payment Splits</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs md:text-sm">Transactions</TabsTrigger>
          </TabsList>
          
          {/* Producers Tab */}
          <TabsContent value="producers">
            <div className="border rounded-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Producer Accounts</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage producer bank details and payment information
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fetchProducers()}
                  className="flex items-center gap-2 w-full md:w-auto"
                  disabled={isLoading}
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <LoadingSkeleton rows={5} />
              ) : producers.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                  <h3 className="text-lg font-medium">No producers found</h3>
                  <p className="text-muted-foreground">
                    No registered producers with bank details.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Producer</TableHead>
                          <TableHead className="min-w-[200px]">Email</TableHead>
                          <TableHead className="min-w-[150px]">Bank Details</TableHead>
                          <TableHead className="min-w-[150px]">Paystack Integration</TableHead>
                          <TableHead className="min-w-[100px]">Split Share</TableHead>
                          <TableHead className="min-w-[200px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {producers.map((producer) => (
                          <TableRow key={producer.id}>
                            <TableCell className="font-medium">
                              {producer.stage_name || producer.full_name}
                            </TableCell>
                            <TableCell className="break-all">{producer.email}</TableCell>
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
                              <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full md:w-auto text-xs"
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
                                  className="w-full md:w-auto text-xs"
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
                  
                  <PaginationControls
                    currentPage={producersPagination.currentPage}
                    totalCount={producersPagination.totalCount}
                    pageSize={producersPagination.pageSize}
                    onPageChange={handleProducersPageChange}
                    isLoading={isLoading}
                  />
                </>
              )}
            </div>
          </TabsContent>
          
          {/* Subaccounts Tab */}
          <TabsContent value="subaccounts">
            <div className="border rounded-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Paystack Subaccounts</h3>
                  <p className="text-sm text-muted-foreground">
                    View all subaccounts created in Paystack for producers
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fetchSubaccounts()}
                  className="flex items-center gap-2 w-full md:w-auto"
                  disabled={isLoading}
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : subaccounts?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Business Name</TableHead>
                        <TableHead className="min-w-[150px]">Subaccount Code</TableHead>
                        <TableHead className="min-w-[120px]">Bank</TableHead>
                        <TableHead className="min-w-[150px]">Account Number</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
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
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Splits Tab */}
          <TabsContent value="splits">
            <div className="border rounded-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Payment Splits</h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage transaction split configurations
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fetchSplits()}
                  className="flex items-center gap-2 w-full md:w-auto"
                  disabled={isLoading}
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : splits?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Split Name</TableHead>
                        <TableHead className="min-w-[150px]">Split Code</TableHead>
                        <TableHead className="min-w-[100px]">Split Type</TableHead>
                        <TableHead className="min-w-[120px]">Main Account</TableHead>
                        <TableHead className="min-w-[150px]">Subaccounts</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
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
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <div className="border rounded-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Transactions</h3>
                  <p className="text-sm text-muted-foreground">
                    View transaction history with payment splits
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fetchTransactions()}
                  className="flex items-center gap-2 w-full md:w-auto"
                  disabled={isLoading}
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : transactions?.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Reference</TableHead>
                          <TableHead className="min-w-[120px]">Beat</TableHead>
                          <TableHead className="min-w-[120px]">Producer</TableHead>
                          <TableHead className="min-w-[120px]">Total Amount</TableHead>
                          <TableHead className="min-w-[120px]">Platform Share</TableHead>
                          <TableHead className="min-w-[120px]">Producer Share</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="font-medium break-all">{tx.reference}</TableCell>
                            <TableCell>{tx.beat}</TableCell>
                            <TableCell>{tx.producer}</TableCell>
                            <TableCell>{formatCurrency(tx.amount)}</TableCell>
                            <TableCell>{formatCurrency(tx.platform_share)}</TableCell>
                            <TableCell>{formatCurrency(tx.producer_share)}</TableCell>
                            <TableCell>{getStatusBadge(tx.status)}</TableCell>
                            <TableCell>
                              {tx.status === 'failed' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleRetryTransaction(tx.id)}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Retry'
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <PaginationControls
                    currentPage={transactionsPagination.currentPage}
                    totalCount={transactionsPagination.totalCount}
                    pageSize={transactionsPagination.pageSize}
                    onPageChange={handleTransactionsPageChange}
                    isLoading={isLoading}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                  <h3 className="text-lg font-medium">No transactions found</h3>
                  <p className="text-muted-foreground mb-4">
                    No transaction history available.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>
                {editMode === 'bank' ? 'Edit Bank Details' : 'Edit Split Percentage'}
              </DialogTitle>
              <DialogDescription>
                {editMode === 'bank' 
                  ? 'Update the producer\'s bank account information'
                  : 'Modify the producer\'s revenue share percentage'
                }
              </DialogDescription>
            </DialogHeader>
            
            {editMode === 'bank' ? (
              activeProducerId && (
                <ProducerBankDetailsForm 
                  producerId={activeProducerId}
                  onSuccess={() => {
                    setIsEditDialogOpen(false);
                    fetchProducers();
                  }}
                />
              )
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="percentage">Producer Share Percentage</Label>
                  <Input
                    id="percentage"
                    type="number"
                    min="1"
                    max="99"
                    value={newPercentage}
                    onChange={(e) => setNewPercentage(Number(e.target.value))}
                  />
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleUpdateSplitPercentage}
                    disabled={isUpdating}
                    className="w-full md:w-auto"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Percentage'
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
