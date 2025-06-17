import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Listar cheques con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const bank = searchParams.get('bank');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (bank) {
      where.bank = {
        contains: bank,
        mode: 'insensitive'
      };
    }
    
    if (dateFrom || dateTo) {
      where.dueDate = {};
      if (dateFrom) {
        where.dueDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.dueDate.lte = new Date(dateTo);
      }
    }

    const [cheques, total] = await Promise.all([
      prisma.cheque.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          payments: {
            include: {
              customer: {
                select: {
                  businessName: true,
                  taxId: true
                }
              }
            }
          }
        }
      }),
      prisma.cheque.count({ where })
    ]);

    return NextResponse.json({
      cheques,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching cheques:', error);
    return NextResponse.json(
      { error: 'Error al obtener cheques' },
      { status: 500 }
    );
  }
}

// POST - Cambiar estado de cheque
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      chequeId,
      newStatus,
      depositBank,
      endorsedTo,
      rejectionReason,
      notes
    } = body;

    if (!chequeId || !newStatus) {
      return NextResponse.json(
        { error: 'chequeId y newStatus son requeridos' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status: newStatus,
      updatedAt: new Date()
    };

    // Agregar campos específicos según el estado
    if (newStatus === 'depositado') {
      updateData.depositDate = new Date();
      if (depositBank) {
        updateData.depositBank = depositBank;
      }
    }

    if (newStatus === 'endosado') {
      updateData.endorsedDate = new Date();
      if (endorsedTo) {
        updateData.endorsedTo = endorsedTo;
      }
    }

    if (newStatus === 'rechazado' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    if (notes) {
      updateData.notes = notes;
    }

    const cheque = await prisma.cheque.update({
      where: { id: chequeId },
      data: updateData,
      include: {
        payments: {
          include: {
            customer: {
              select: {
                businessName: true,
                taxId: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(cheque);

  } catch (error) {
    console.error('Error updating cheque:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cheque' },
      { status: 500 }
    );
  }
} 