import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { useDispatch, useSelector } from 'react-redux';
import {
  Entypo,
  Feather,
  AntDesign,
} from '@expo/vector-icons';
import {
  StylesGlobal,
  Mixins,
  Typography,
  Colors,
} from '../../../styles';
import ButtonFloating from '../../../components/ButtonFloating';
import TextCustom from '../../../components/TextCustom';
import TwoViews from '../../../components/TwoViews';
import Messages from '../../../resources/messages';
import Alerta from '../../../components/Alerta';

// Actions
import { getAllAddress } from '../../../store/actions/addressAction';

export default function Addresses({ navigation }) {
  const dispatch = useDispatch();

  const [data, setData] = useState([]);

  const [showAlert, setShowAlert] = useState(false);
  const [titleMessage, setTitleMessage] = useState(null);
  const [messageAlert, setMessageAlert] = useState(null);

  /* Selector State */
  const userLogin = useSelector(state => state.userLogin);
  const { userInfo } = userLogin;

  const addressList = useSelector(state => state.addressList);
  /* Selector State */

  useEffect(() => {
    if (!userInfo)
      navigation.goBack();
  }, [userInfo]);

  useEffect(() => {
    dispatch(getAllAddress());
  }, []);

  useEffect(() => {
    if (addressList && Object.keys(addressList).length !== 0) {
      if (addressList.data) {
        setData(addressList.data);
      }
      if (addressList.error) {
        setShowAlert(true);
        setTitleMessage(Messages.addressList.alertMessage);
        setMessageAlert(addressList.error);
      }
    }
  }, [addressList]);

  const renderItem = ({ item }) => (
    <View
      style={[
        Mixins.size('100%'),
        Mixins.padding(10, 10, 10, 10),
      ]}
    >
      <View
        style={[
          StylesGlobal.justifyCenterContent,
          StylesGlobal.bColorPrimary,
          StylesGlobal.bgColorWhite,
          Mixins.padding(10, 10, 10, 10),
          Mixins.size('100%'),
          Mixins.borderRad(10),
        ]}
      >
        <TwoViews
          showBgColor={false}
          stylesLeftView={[
            Mixins.size('50%', 'auto'),
          ]}
          ContentLeft={() => (
            <View style={StylesGlobal.row}>
              <Entypo name="location-pin" size={24} color={Colors.SECONDARY} />
              <TextCustom
                value={`${(item.firstName) || ''}`}
                styles={[
                  StylesGlobal.textPrimaryBold,
                ]}
              />
            </View>
          )}
          stylesRightView={[
            Mixins.size('50%', 'auto'),
          ]}
          ContentRight={() => (
            <TextCustom
              value={`${(item.phoneNumber) || ''}`}
              styles={[
                StylesGlobal.textGrayDark,
                Mixins.margin(0, 0, 0, 10)
              ]}
            />
          )}
        />
        <TwoViews
          showBgColor={false}
          stylesLeftView={[
            Mixins.size('80%', 'auto'),
          ]}
          ContentLeft={() => (
            <TextCustom
              value={`${(item.address1) ? `${item.address1},` : ''} ${(item.address2) ? `${item.address2},` : ''} ${(item.city) ? `${item.city},` : ''} ${(item.zipPostalCode) || ''}`}
              styles={[
                StylesGlobal.textPrimary,
              ]}
            />
          )}
          stylesRightView={[
            Mixins.size('20%', 'auto'),
          ]}
          ContentRight={() => (
            <TouchableOpacity
              style={[
                StylesGlobal.alignCenterContent,
              ]}
              onPress={() => { navigation.navigate('AddAndEditAddress', { addressId: item.id }); }}
            >
              <Feather name="edit-2" size={30} color={Colors.SECONDARY} />
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  return (
    <View
      style={[
        StylesGlobal.alignCenterContent,
        StylesGlobal.bgColorGrayScreen,
        Mixins.size('100%', 'auto'),
        Mixins.space(),
      ]}
    >
      <Spinner
        visible={addressList.loading}
        textContent={'Cargando...'}
        textStyle={StylesGlobal.textWhite}
      />
      <View
        style={Mixins.size('100%', '100%')}
      >
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
        />
      </View>
      <ButtonFloating
        styleContainerButton={[
          StylesGlobal.bgColorGrayLight,
          Mixins.position(null, 10, 10, null),
          Mixins.borderRad(60),
          Mixins.size(80, 80),
        ]}
        styleButton={[
          StylesGlobal.bgColorSecondary,
          Mixins.borderRad(60),
          Mixins.size(70, 70),
        ]}
        onPress={() => { navigation.navigate('AddAndEditAddress'); }}
        showIcon
        Icon={() => <AntDesign name="plus" size={30} color={Colors.WHITE} />}
      />
      <Alerta
        ShowAlert={showAlert}
        Title={titleMessage}
        Messages={messageAlert}
        ShowCancel={false}
        TextConfirm="Aceptar"
        OnConfirm={() => {
          setShowAlert(false);
        }}
      />
    </View>
  )
}
