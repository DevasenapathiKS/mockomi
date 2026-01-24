import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCouponsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'flat',
    discountValue: 0,
    perUserLimit: 0,
    globalLimit: 0,
    expiresAt: '',
    isActive: true,
  });
  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: adminService.getAllCoupons,
  });

  const createMutation = useMutation({
    mutationFn: adminService.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created successfully');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon updated successfully');
      setEditingCoupon(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      perUserLimit: 0,
      globalLimit: 0,
      expiresAt: '',
      isActive: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data - don't send globalLimit if it's 0 or empty (it's optional)
    const submitData = {
      code: formData.code,
      description: formData.description,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      perUserLimit: formData.perUserLimit,
      expiresAt: formData.expiresAt || undefined,
      ...(formData.globalLimit && formData.globalLimit > 0 && { globalLimit: formData.globalLimit }),
    };
    
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleToggleActive = (couponId: string, currentStatus: boolean) => {
    updateMutation.mutate({
      id: couponId,
      data: { isActive: !currentStatus },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Coupon Management</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Create and manage discount coupons</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
              setEditingCoupon(null);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </div>

        {/* Coupons List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : coupons && coupons.length > 0 ? (
            coupons.map((coupon) => (
              <Card key={coupon._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {coupon.code}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={coupon.isActive ? 'success' : 'default'}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(coupon._id, coupon.isActive)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {coupon.isActive ? (
                        <ToggleRight className="h-6 w-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    {coupon.description && (
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Description: </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-50">
                          {coupon.description}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Discount: </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : `₹${coupon.discountValue}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Usage: </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">
                        {coupon.totalUsed || 0} / {coupon.globalLimit || '∞'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Per User Limit: </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">
                        {coupon.perUserLimit}
                      </span>
                    </div>
                    {coupon.expiresAt && (
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Expires: </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-50">
                          {new Date(coupon.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFormData({
                          code: coupon.code,
                          description: coupon.description || '',
                          discountType: coupon.discountType || 'percentage',
                          discountValue: coupon.discountValue || 0,
                          perUserLimit: coupon.perUserLimit,
                          globalLimit: coupon.globalLimit || 0,
                          expiresAt: coupon.expiresAt
                            ? new Date(coupon.expiresAt).toISOString().split('T')[0]
                            : '',
                          isActive: coupon.isActive,
                        });
                        setEditingCoupon(coupon._id);
                        setShowCreateModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No coupons found</p>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Coupon Code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter coupon description..."
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountType: e.target.value as 'percentage' | 'flat',
                          discountValue: 0, // Reset value when changing type
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <Input
                    label={formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount (₹)'}
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (formData.discountType === 'percentage') {
                        setFormData({
                          ...formData,
                          discountValue: Math.min(100, Math.max(0, value)),
                        });
                      } else {
                        setFormData({
                          ...formData,
                          discountValue: Math.max(0, value),
                        });
                      }
                    }}
                    required
                    min={0}
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                    placeholder={
                      formData.discountType === 'percentage'
                        ? 'Enter discount percentage (0-100)'
                        : 'Enter discount amount in ₹'
                    }
                  />
                  <Input
                    label="Per User Limit"
                    type="number"
                    value={formData.perUserLimit}
                    onChange={(e) => setFormData({ ...formData, perUserLimit: Number(e.target.value) })}
                    required
                    min={1}
                    placeholder="How many times can each user use this coupon?"
                  />
                  <Input
                    label="Global Limit (Optional)"
                    type="number"
                    value={formData.globalLimit > 0 ? formData.globalLimit : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({
                        ...formData,
                        globalLimit: value === '' ? 0 : Number(value),
                      });
                    }}
                    min={1}
                    placeholder="Total times this coupon can be used (leave empty for unlimited)"
                  />
                  <Input
                    label="Expiry Date (Optional)"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1"
                      isLoading={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingCoupon ? 'Update' : 'Create'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                        setEditingCoupon(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
