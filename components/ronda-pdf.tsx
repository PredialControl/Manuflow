"use client";

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register a font for better look
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_eeA.woff', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_eeA.woff', fontWeight: 700 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGOfAZ9hjp-Ek-_eeA.woff', fontWeight: 900 },
    ],
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Inter',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
        borderBottomWidth: 2,
        borderBottomColor: '#0F766E',
        paddingBottom: 20,
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoBox: {
        width: 40,
        height: 40,
        backgroundColor: '#0F766E',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 900,
    },
    headerInfo: {
        textAlign: 'right',
    },
    title: {
        fontSize: 24,
        fontWeight: 900,
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: -1,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        fontWeight: 700,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    contractBadge: {
        backgroundColor: '#F3F4F6',
        padding: '4 12',
        borderRadius: 20,
        marginTop: 10,
        alignSelf: 'flex-end',
    },
    contractText: {
        fontSize: 8,
        fontWeight: 900,
        color: '#374151',
        textTransform: 'uppercase',
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 40,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    summaryLabel: {
        fontSize: 8,
        fontWeight: 700,
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: 900,
        color: '#111827',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 900,
        color: '#111827',
        textTransform: 'uppercase',
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepCard: {
        marginBottom: 15,
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    stepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    stepNumber: {
        fontSize: 10,
        fontWeight: 900,
        color: '#0F766E',
        backgroundColor: '#F0FDFA',
        width: 20,
        height: 20,
        borderRadius: 10,
        textAlign: 'center',
        lineHeight: 20,
    },
    statusBadge: {
        padding: '4 10',
        borderRadius: 8,
    },
    statusText: {
        fontSize: 8,
        fontWeight: 900,
        textTransform: 'uppercase',
    },
    stepDescription: {
        fontSize: 12,
        fontWeight: 700,
        color: '#111827',
        marginBottom: 8,
    },
    assetText: {
        fontSize: 8,
        fontWeight: 900,
        color: '#0F766E',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    observationSection: {
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 8,
        marginTop: 5,
        borderLeftWidth: 3,
        borderLeftColor: '#CBD5E1',
    },
    observationLabel: {
        fontSize: 7,
        fontWeight: 900,
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    observationText: {
        fontSize: 9,
        fontWeight: 400,
        color: '#334155',
        fontStyle: 'italic',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 8,
        color: '#9CA3AF',
    }
});

interface RondaPdfProps {
    ronda: any;
}

export const RondaPdf = ({ ronda }: RondaPdfProps) => {
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('pt-BR');
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        <View style={styles.logoBox}>
                            <Image src="/logo.png" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                        </View>
                        <View>
                            <Text style={styles.title}>ManuFlow</Text>
                            <Text style={styles.subtitle}>Relatório de Inspeção</Text>
                        </View>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={{ fontSize: 10, fontWeight: 900, color: '#111827' }}>ID #{ronda.id.slice(-6).toUpperCase()}</Text>
                        <View style={styles.contractBadge}>
                            <Text style={styles.contractText}>{ronda.contract.name}</Text>
                        </View>
                    </View>
                </View>

                {/* Summary */}
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Agenda</Text>
                        <Text style={styles.summaryValue}>{ronda.schedule.name}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Técnico</Text>
                        <Text style={styles.summaryValue}>{ronda.assignee?.name || 'Não atribuído'}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Data/Hora</Text>
                        <Text style={styles.summaryValue}>{formatDate(ronda.completedAt || ronda.date)}</Text>
                    </View>
                </View>

                {/* Steps List */}
                <View>
                    <Text style={styles.sectionTitle}>Roteiro de Verificação</Text>
                    {ronda.steps.map((step: any, index: number) => (
                        <View key={step.id} style={styles.stepCard} wrap={false}>
                            <View style={styles.stepHeader}>
                                <Text style={styles.stepNumber}>{index + 1}</Text>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: step.status === 'OK' ? '#ECFDF5' : (step.status === 'WARNING' || step.status === 'CRITICAL' ? '#FFFBEB' : '#F3F4F6') }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: step.status === 'OK' ? '#059669' : (step.status === 'WARNING' || step.status === 'CRITICAL' ? '#D97706' : '#6B7280') }
                                    ]}>
                                        {step.status === 'OK' ? 'Em funcionamento' : (step.status === 'WARNING' || step.status === 'CRITICAL' ? 'Atenção' : 'Pendente')}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.stepDescription}>{step.description}</Text>
                            {step.asset && (
                                <Text style={styles.assetText}>Ativo: {step.asset.name}</Text>
                            )}

                            {step.notes && (
                                <View style={styles.observationSection}>
                                    <Text style={styles.observationLabel}>Observação Técnica</Text>
                                    <Text style={styles.observationText}>{step.notes}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Gerado por ManuFlow Intelligence</Text>
                    <Text style={styles.footerText}>Página 1</Text>
                </View>
            </Page>
        </Document>
    );
};
