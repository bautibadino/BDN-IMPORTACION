"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MoreHorizontal, PlusCircle, Star, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { SupplierForm } from "@/app/suppliers/components/supplier-form"
import type { Supplier } from "@/lib/types"
import { deleteSupplierAction, getSuppliersAction } from "./actions"
import { useToast } from "@/components/ui/use-toast"
// import { getSuppliers as fetchSuppliers } from "@/lib/store"
import { PageHeader } from "@/app/components/page-header"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const { toast } = useToast()
  const [dataVersion, setDataVersion] = useState(0)
  const refreshData = () => setDataVersion((v) => v + 1)

  useEffect(() => {
    async function loadSuppliers() {
      const data = await getSuppliersAction()
      setSuppliers(data)
    }
    loadSuppliers()
  }, [dataVersion])

  const handleOpenDialog = (supplier?: Supplier) => {
    setEditingSupplier(supplier || null)
    setIsDialogOpen(true)
  }
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingSupplier(null)
    refreshData()
  }
  const handleDeleteSupplier = async (id: string) => {
    if (confirm("¿Estás seguro? Se eliminarán también las notas asociadas.")) {
      const result = await deleteSupplierAction(id)
      if (result.success) {
        toast({ title: "Éxito", description: result.message })
        refreshData()
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    }
  }

  return (
    <>
      <PageHeader title="Proveedores">
        <Button size="sm" className="gap-1" onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-4 w-4" /> Nuevo Proveedor
        </Button>
      </PageHeader>
      <div className="border rounded-lg w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead className="text-center">Rating</TableHead>
              <TableHead className="text-center">Verificado</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">
                  <Link href={`/suppliers/${supplier.id}`} className="hover:underline">
                    {supplier.name}
                  </Link>
                </TableCell>
                <TableCell>{supplier.country}</TableCell>
                <TableCell>{supplier.source}</TableCell>
                <TableCell className="text-center">
                  {supplier.rating && (
                    <div className="flex items-center justify-center">
                      {supplier.rating} <Star className="h-4 w-4 ml-1 text-yellow-400 fill-yellow-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {supplier.isVerified && <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />}
                </TableCell>
                <TableCell>
                  {supplier.tags?.split(",").map((tag) => (
                    <Badge key={tag} variant="secondary" className="mr-1 mb-1">
                      {tag.trim()}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/suppliers/${supplier.id}`}>Ver Detalles</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenDialog(supplier)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteSupplier(supplier.id)} className="text-red-600">
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {" "}
          {/* Aumentado el ancho para el form */}
          <SupplierForm supplier={editingSupplier} onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </>
  )
}
