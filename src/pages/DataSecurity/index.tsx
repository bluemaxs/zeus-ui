import React, { useState } from 'react';
import SecondLayout from '@/components/SecondLayout';
import BackupRecovery from '@/pages/InstanceList/Detail/BackupRecovery';
import { getMiddlewareDetail } from '@/services/middleware';
import { Message } from '@alicloud/console-components';
import messageConfig from '@/components/messageConfig';
import NoService from '@/components/NoService';
import { middlewareDetailProps, basicDataProps } from '@/types/comment';
import { clusterType } from '@/types';

export default function DataSecurity(): JSX.Element {
	const [data, setData] = useState<middlewareDetailProps>();
	const [basicData, setBasicData] = useState<basicDataProps>();
	const [isService, setIsService] = useState<boolean>(false);
	const onChange = (
		name: string,
		type: string,
		namespace: string,
		cluster: clusterType
	) => {
		if (name !== type) {
			setBasicData({
				name,
				type,
				clusterId: cluster.id,
				namespace,
				storage: cluster.storage
			});
			getMiddlewareDetail({
				clusterId: cluster.id,
				namespace,
				type,
				middlewareName: name
			}).then((res) => {
				if (res.success) {
					setIsService(true);
					setData(res.data);
				} else {
					Message.show(messageConfig('error', '失败', res));
				}
			});
		} else {
			setIsService(false);
		}
	};
	const NotSupport = () => (
		<h3 style={{ textAlign: 'center' }}>
			该中间件类型不支持该功能，请选择mysql类型的中间件
		</h3>
	);
	return (
		<SecondLayout
			title="数据安全"
			subTitle="主要用于数据的备份及恢复"
			hasBackArrow={true}
			onChange={onChange}
		>
			{basicData?.type !== 'mysql' && isService && <NotSupport />}
			{basicData?.type === 'mysql' &&
				isService &&
				JSON.stringify(data) !== '{}' && (
					<BackupRecovery
						type={basicData?.type}
						data={data}
						storage={basicData?.storage}
						clusterId={basicData?.clusterId}
						namespace={basicData?.namespace}
						customMid={data?.dynamicValues !== null}
						capabilities={(data && data.capabilities) || []}
					/>
				)}
			{!isService && <NoService />}
		</SecondLayout>
	);
}
