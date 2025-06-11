"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProductForm } from "./components/product-form"
import { deleteProductAction } from "./actions"
import { useToast } from "@/components/ui/use-toast"
import { getProductsAction, getProductLeadsAction } from "./actions"
import type { Product, ProductLead } from "@/lib/types"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [productLeads, setProductLeads] = useState<ProductLead[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      const [productsData, leadsData] = await Promise.all([getProductsAction(), getProductLeadsAction()])
      setProducts(productsData)
      setProductLeads(leadsData)
    }
    loadData()
  }, [])

  const handleOpenDialog = (product?: Product) => {
    setEditingProduct(product || null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
  }

  const handleDeleteProduct = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      const result = await deleteProductAction(id)
      if (result.success) {
        toast({ title: "Éxito", description: result.message })
        setProducts((prev) => prev.filter((p) => p.id !== id))
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    }
  }

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Productos</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Nuevo Producto</span>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos</CardTitle>
          <CardDescription>Gestiona tus productos finales con costos y precios.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Costo U. (USD)</TableHead>
                <TableHead>Costo U. (ARS)</TableHead>
                <TableHead>Precio Final (ARS)</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>${product.finalUnitCostUsd.toFixed(2)}</TableCell>
                  <TableCell>${product.finalUnitCostArs.toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">${product.finalPriceArs.toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenDialog(product)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)}>Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {/* Aquí pasamos productLead como null porque es un CRUD genérico, 
            la creación desde un lead específico se manejaría de otra forma o 
            se podría añadir un selector de leads aquí.
            Para la creación desde la página de pedidos, se pasarían los defaultValues.
        */}
          <ProductForm
            product={editingProduct}
            productLead={null}
            onClose={handleCloseDialog}
            allProductLeads={productLeads}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
